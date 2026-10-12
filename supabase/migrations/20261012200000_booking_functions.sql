-- Booking functions. Customers have no direct access to appointments, so these
-- SECURITY DEFINER functions do all validation and pricing inside the database.
-- Prices, durations, deposits and slot availability are never taken from the client.

-- Straight-line distance in km between two coordinates (used as a floor for travel distance).
create or replace function public.km_between(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision
language sql
immutable
set search_path = ''
as $$
  select 2 * 6371 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

-- Free start times for one day. Returns start times only, never customer data.
create or replace function public.available_slots(p_day date, p_duration_minutes integer, p_buffer_minutes integer default 0)
returns table (slot_start timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_step integer;
  v_lead integer;
  v_max_per_day integer;
  v_count integer;
  w record;
  v_open timestamptz;
  v_close timestamptz;
  v_t timestamptz;
begin
  if p_duration_minutes is null or p_duration_minutes <= 0 or p_duration_minutes > 480 then
    return;
  end if;

  if p_buffer_minutes is null or p_buffer_minutes < 0 or p_buffer_minutes > 240 then
    return;
  end if;

  select s.slot_step_minutes, s.booking_lead_hours, s.max_appointments_per_day
    into v_step, v_lead, v_max_per_day
  from public.settings s where s.id = 1;

  select count(*) into v_count
  from public.appointments a
  where a.status not in ('cancelled', 'expired')
    and (a.starts_at at time zone 'Europe/Amsterdam')::date = p_day;

  if v_count >= v_max_per_day then
    return;
  end if;

  for w in
    select wh.opens_at, wh.closes_at
    from public.work_hours wh
    where wh.active and wh.weekday = extract(dow from p_day)::integer
    order by wh.opens_at
  loop
    v_open := (p_day + w.opens_at) at time zone 'Europe/Amsterdam';
    v_close := (p_day + w.closes_at) at time zone 'Europe/Amsterdam';
    v_t := v_open;

    while v_t + make_interval(mins => p_duration_minutes) <= v_close loop
      if v_t >= now() + make_interval(hours => v_lead)
        and not exists (
          select 1 from public.appointments a
          where a.status not in ('cancelled', 'expired')
            and tstzrange(a.starts_at, a.blocked_until, '[)')
                && tstzrange(v_t, v_t + make_interval(mins => p_duration_minutes + p_buffer_minutes), '[)')
        )
        and not exists (
          select 1 from public.blocked_periods b
          where tstzrange(b.starts_at, b.ends_at, '[)')
                && tstzrange(v_t, v_t + make_interval(mins => p_duration_minutes), '[)')
        )
      then
        slot_start := v_t;
        return next;
      end if;

      v_t := v_t + make_interval(mins => v_step);
    end loop;
  end loop;
end;
$$;

revoke all on function public.available_slots(date, integer, integer) from public;
grant execute on function public.available_slots(date, integer, integer) to anon, authenticated;

-- Creates a booking. Returns the reference and a one-time status token for the status link.
create or replace function public.create_booking(
  p_model_id uuid,
  p_items jsonb,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_customer_note text,
  p_street text,
  p_house_number text,
  p_postcode text,
  p_city text,
  p_lat double precision,
  p_lng double precision,
  p_travel_km numeric,
  p_starts_at timestamptz,
  p_payment_choice text,
  p_requires_payment boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.settings%rowtype;
  v_model_label text;
  v_items jsonb := '[]'::jsonb;
  v_item jsonb;
  v_repair_total integer := 0;
  v_duration integer := 0;
  v_seen_types uuid[] := '{}';
  v_row record;
  v_straight_km double precision;
  v_billable_km numeric;
  v_travel_fee integer := 0;
  v_total integer;
  v_deposit integer;
  v_day date;
  v_reference text;
  v_token text;
  v_id uuid;
  v_ends timestamptz;
begin
  -- Customer details
  if length(trim(coalesce(p_customer_name, ''))) < 2 then raise exception 'Vul je naam in.'; end if;
  if length(trim(coalesce(p_customer_phone, ''))) < 6 then raise exception 'Vul een geldig telefoonnummer in.'; end if;
  if p_customer_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Vul een geldig e-mailadres in.'; end if;
  if length(trim(coalesce(p_street, ''))) < 2 or length(trim(coalesce(p_house_number, ''))) < 1
     or length(trim(coalesce(p_city, ''))) < 2 or length(trim(coalesce(p_postcode, ''))) < 6 then
    raise exception 'Vul een volledig adres in.';
  end if;
  if p_lat is null or p_lng is null then raise exception 'Kies een adres uit de lijst.'; end if;
  if p_payment_choice not in ('deposit', 'full') then raise exception 'Kies een betaalmethode.'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 10 then
    raise exception 'Kies minimaal één reparatie.';
  end if;

  select * into s from public.settings where id = 1;

  if p_payment_choice = 'full' and not s.allow_full_prepay then
    raise exception 'Vooraf volledig betalen is op dit moment niet mogelijk.';
  end if;

  -- Model must be active, and its brand too
  select m.name into v_model_label
  from public.device_models m
  join public.brands b on b.id = m.brand_id
  where m.id = p_model_id and m.active and b.active;

  if v_model_label is null then raise exception 'Dit model is niet beschikbaar.'; end if;

  -- Build items from the database, never from the client
  for v_item in select value from jsonb_array_elements(p_items) loop
    if v_item->>'repairTypeId' is null or v_item->>'qualityId' is null then
      raise exception 'Ongeldige reparatiekeuze.';
    end if;

    if (v_item->>'repairTypeId')::uuid = any(v_seen_types) then
      raise exception 'Kies per reparatie maar één kwaliteit.';
    end if;
    v_seen_types := v_seen_types || (v_item->>'repairTypeId')::uuid;

    select rp.price_cents,
           coalesce(rp.duration_minutes, rt.duration_minutes) as duration_minutes,
           rt.name as repair_name,
           q.name as quality_name
      into v_row
    from public.repair_prices rp
    join public.repair_types rt on rt.id = rp.repair_type_id
    join public.repair_qualities q on q.id = rp.quality_id
    where rp.model_id = p_model_id
      and rp.repair_type_id = (v_item->>'repairTypeId')::uuid
      and rp.quality_id = (v_item->>'qualityId')::uuid
      and rp.active and rt.active and q.active;

    if v_row is null then
      raise exception 'Deze reparatie is niet beschikbaar voor dit model.';
    end if;

    v_repair_total := v_repair_total + v_row.price_cents;
    v_duration := v_duration + v_row.duration_minutes;

    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'repairTypeId', v_item->>'repairTypeId',
      'name', v_row.repair_name,
      'qualityName', v_row.quality_name,
      'priceCents', v_row.price_cents,
      'durationMinutes', v_row.duration_minutes
    ));
  end loop;

  -- Travel fee. The distance must be at least the straight-line distance from the start point.
  if s.start_lat is null or s.start_lng is null then
    raise exception 'Het startadres van de monteur is nog niet ingesteld.';
  end if;

  if p_travel_km is null or p_travel_km < 0 then
    raise exception 'Afstand ontbreekt.';
  end if;

  v_straight_km := public.km_between(s.start_lat, s.start_lng, p_lat, p_lng);

  if p_travel_km + 0.5 < v_straight_km then
    raise exception 'Afstand klopt niet met het adres.';
  end if;

  if p_travel_km > s.max_travel_km then
    raise exception 'Dit adres ligt buiten ons werkgebied.';
  end if;

  v_billable_km := greatest(0, p_travel_km - s.free_travel_km)
    * case when s.travel_distance_mode = 'round_trip' then 2 else 1 end;
  v_travel_fee := round(v_billable_km * s.price_per_km_cents);

  v_total := v_repair_total + v_travel_fee;

  -- Upfront amount
  if p_payment_choice = 'full' then
    v_deposit := v_total;
  elsif s.deposit_type = 'fixed' then
    v_deposit := least(s.deposit_value, v_total);
  else
    v_deposit := round(v_total * s.deposit_value / 100.0);
  end if;

  -- The slot must still be free. The exclusion constraint is the final guard.
  v_day := (p_starts_at at time zone 'Europe/Amsterdam')::date;

  if not exists (
    select 1 from public.available_slots(v_day, v_duration, s.travel_buffer_minutes) fs
    where fs.slot_start = p_starts_at
  ) then
    raise exception 'Dit tijdslot is niet (meer) beschikbaar. Kies een ander moment.';
  end if;

  v_ends := p_starts_at + make_interval(mins => v_duration);

  -- Reference and status token
  loop
    v_reference := '054-' || upper(substr(encode(extensions.gen_random_bytes(5), 'hex'), 1, 8));
    exit when not exists (select 1 from public.appointments where reference = v_reference);
  end loop;

  v_token := encode(extensions.gen_random_bytes(24), 'hex');

  begin
    insert into public.appointments (
      reference, status_token_hash, status, payment_status, payment_choice,
      customer_name, customer_phone, customer_email, customer_note,
      street, house_number, postcode, city, lat, lng, travel_km, travel_fee_cents,
      model_id, model_label, items, duration_minutes,
      repair_total_cents, total_cents, deposit_cents, paid_cents,
      starts_at, ends_at, travel_buffer_minutes, hold_expires_at
    ) values (
      v_reference, encode(extensions.digest(v_token, 'sha256'), 'hex'), 'new', 'unpaid', p_payment_choice,
      trim(p_customer_name), trim(p_customer_phone), lower(trim(p_customer_email)), nullif(trim(coalesce(p_customer_note, '')), ''),
      trim(p_street), trim(p_house_number), upper(replace(trim(p_postcode), ' ', '')), trim(p_city), p_lat, p_lng,
      round(p_travel_km, 1), v_travel_fee,
      p_model_id, v_model_label, v_items, v_duration,
      v_repair_total, v_total, v_deposit, 0,
      p_starts_at, v_ends, s.travel_buffer_minutes,
      case when p_requires_payment then now() + interval '15 minutes' else null end
    )
    returning id into v_id;
  exception when exclusion_violation then
    raise exception 'Dit tijdslot is zojuist geboekt. Kies een ander moment.';
  end;

  return jsonb_build_object(
    'reference', v_reference,
    'token', v_token,
    'startsAt', p_starts_at,
    'endsAt', v_ends,
    'totalCents', v_total,
    'depositCents', v_deposit,
    'travelFeeCents', v_travel_fee
  );
end;
$$;

revoke all on function public.create_booking(uuid, jsonb, text, text, text, text, text, text, text, text, double precision, double precision, numeric, timestamptz, text, boolean) from public;
grant execute on function public.create_booking(uuid, jsonb, text, text, text, text, text, text, text, text, double precision, double precision, numeric, timestamptz, text, boolean) to anon, authenticated;

-- Status for the customer's status link. Needs the reference and the token from the link.
create or replace function public.get_booking_status(p_reference text, p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'reference', a.reference,
    'status', a.status,
    'paymentStatus', a.payment_status,
    'paymentChoice', a.payment_choice,
    'startsAt', a.starts_at,
    'endsAt', a.ends_at,
    'modelLabel', a.model_label,
    'items', a.items,
    'street', a.street,
    'houseNumber', a.house_number,
    'postcode', a.postcode,
    'city', a.city,
    'customerName', a.customer_name,
    'travelFeeCents', a.travel_fee_cents,
    'totalCents', a.total_cents,
    'depositCents', a.deposit_cents,
    'paidCents', a.paid_cents,
    'cancelledAt', a.cancelled_at,
    'holdExpiresAt', a.hold_expires_at
  )
  from public.appointments a
  where a.reference = upper(trim(p_reference))
    and a.status_token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');
$$;

revoke all on function public.get_booking_status(text, text) from public;
grant execute on function public.get_booking_status(text, text) to anon, authenticated;

-- Customers may cancel up to the start of their slot. Refunds are handled by an admin.
create or replace function public.cancel_booking(p_reference text, p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.appointments%rowtype;
begin
  select * into a from public.appointments
  where reference = upper(trim(p_reference))
    and status_token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  for update;

  if a.id is null then
    raise exception 'Deze afspraak is niet gevonden.';
  end if;

  if a.status in ('cancelled', 'expired', 'returned') then
    raise exception 'Deze afspraak kan niet meer worden geannuleerd.';
  end if;

  if a.starts_at <= now() then
    raise exception 'De afspraak is al begonnen. Neem contact met ons op.';
  end if;

  update public.appointments
  set status = 'cancelled', cancelled_at = now(), cancel_reason = 'Geannuleerd door klant', updated_at = now()
  where id = a.id;

  return jsonb_build_object('reference', a.reference, 'paidCents', a.paid_cents);
end;
$$;

revoke all on function public.cancel_booking(text, text) from public;
grant execute on function public.cancel_booking(text, text) to anon, authenticated;
