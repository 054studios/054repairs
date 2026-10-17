-- Additive upgrade. Apply before enabling funnel measurements or reminder mail.
-- Booking abuse guard runs in the database, including direct anonymous RPC requests.
create or replace function public.guard_booking_volume()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_phone text := pg_catalog.regexp_replace(new.customer_phone, '[^0-9]', '', 'g');
  v_email text := pg_catalog.lower(pg_catalog.btrim(new.customer_email));
  v_address text := pg_catalog.upper(pg_catalog.regexp_replace(new.postcode || ':' || new.house_number, '\s', '', 'g'));
  v_key bigint;
begin
  if public.is_admin() then return new; end if;
  if pg_catalog.length(v_phone) < 6 or pg_catalog.length(v_phone) > 20
    or pg_catalog.length(v_email) > 254 then
    raise exception 'Controleer je contactgegevens.';
  end if;
  -- Sorted locks also serialize parallel requests sharing any of these identities.
  for v_key in
    select distinct k from unnest(array[
      pg_catalog.hashtextextended('phone:' || v_phone, 0),
      pg_catalog.hashtextextended('email:' || v_email, 0),
      pg_catalog.hashtextextended('address:' || v_address, 0)
    ]) as keys(k) order by k
  loop perform pg_catalog.pg_advisory_xact_lock(v_key); end loop;
  if (select count(*) from public.appointments a
      where a.created_at > now() - interval '24 hours'
      and (pg_catalog.regexp_replace(a.customer_phone, '[^0-9]', '', 'g') = v_phone
        or pg_catalog.lower(pg_catalog.btrim(a.customer_email)) = v_email)) >= 5
    or (select count(*) from public.appointments a where a.created_at > now() - interval '24 hours'
      and pg_catalog.upper(pg_catalog.regexp_replace(a.postcode || ':' || a.house_number, '\s', '', 'g')) = v_address) >= 8
  then raise exception 'Er zijn veel boekingen met deze gegevens. Neem contact met ons op om verder te boeken.';
  end if;
  return new;
end;
$$;
create trigger appointments_guard_volume before insert on public.appointments
for each row execute function public.guard_booking_volume();
create index appointments_email_created_idx on public.appointments (lower(btrim(customer_email)), created_at);
create index appointments_phone_created_idx on public.appointments ((regexp_replace(customer_phone, '[^0-9]', '', 'g')), created_at);
create index appointments_address_created_idx on public.appointments ((upper(regexp_replace(postcode || ':' || house_number, '\s', '', 'g'))), created_at);
revoke all on function public.guard_booking_volume() from public, anon, authenticated;

-- Aggregate event totals only. No IP, URL, device, token, contact details or visitor IDs.
create table public.funnel_daily (
  day date not null,
  event text not null check (event in ('step_1','step_2','step_3','step_4','step_5','step_6','booking_created','booking_failed','payment_failed','payment_paid')),
  total bigint not null default 0 check (total >= 0),
  primary key (day, event)
);
alter table public.funnel_daily enable row level security;
create policy funnel_admin_read on public.funnel_daily for select to authenticated using ((select public.is_admin()));
revoke all on public.funnel_daily from anon, authenticated;
grant select on public.funnel_daily to authenticated;
create or replace function public.record_funnel_event(p_event text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_event not in ('step_1','step_2','step_3','step_4','step_5','step_6','booking_created','booking_failed','payment_failed','payment_paid') or p_event is null then
    raise exception 'Ongeldig event.';
  end if;
  insert into public.funnel_daily(day, event, total)
  values ((now() at time zone 'Europe/Amsterdam')::date, p_event, 1)
  on conflict (day, event) do update set total = least(public.funnel_daily.total + 1, 1000000);
end;
$$;
-- Only server writes: browser requests go through the bounded, same-origin endpoint.
revoke all on function public.record_funnel_event(text) from public, anon, authenticated;
grant execute on function public.record_funnel_event(text) to service_role;

-- One reminder per appointment time; a reschedule can receive a new reminder.
create table public.appointment_reminders (
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  starts_at timestamptz not null,
  claimed_at timestamptz not null default now(),
  sent_at timestamptz,
  attempts integer not null default 1,
  primary key (appointment_id, starts_at)
);
alter table public.appointment_reminders enable row level security;
create policy reminders_admin_read on public.appointment_reminders for select to authenticated using ((select public.is_admin()));
revoke all on public.appointment_reminders from anon, authenticated;
grant select on public.appointment_reminders to authenticated;
grant select, update on public.appointment_reminders to service_role;
create or replace function public.claim_appointment_reminders()
returns table(appointment_id uuid, starts_at timestamptz)
language sql security definer set search_path = '' as $$
  insert into public.appointment_reminders as r (appointment_id, starts_at)
  select a.id, a.starts_at from public.appointments a
  where a.status in ('new','confirmed')
    and a.starts_at > now() and a.starts_at <= now() + interval '26 hours'
    and (a.paid_cents >= a.deposit_cents or a.status = 'confirmed')
    and (a.hold_expires_at is null or a.hold_expires_at > now())
    and not exists (
      select 1 from public.appointment_reminders old
      where old.appointment_id = a.id and old.starts_at = a.starts_at
        and (old.sent_at is not null or old.claimed_at > now() - interval '10 minutes' or old.attempts >= 3)
    )
  order by a.starts_at limit 20
  on conflict (appointment_id, starts_at) do update
    set claimed_at = now(), attempts = r.attempts + 1
    where r.sent_at is null and r.claimed_at <= now() - interval '10 minutes' and r.attempts < 3
  returning r.appointment_id, r.starts_at;
$$;
revoke all on function public.claim_appointment_reminders() from public, anon, authenticated;
grant execute on function public.claim_appointment_reminders() to service_role;
