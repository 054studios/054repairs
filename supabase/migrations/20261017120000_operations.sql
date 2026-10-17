-- Operational features are opt-in. Apply after 20261017090000_booking_upgrades.sql.
create table public.operations_settings (
 id smallint primary key default 1 check(id=1),
 route_planning boolean not null default false,
 average_kmh integer not null default 35 check(average_kmh between 10 and 130),
 arrival_margin_minutes integer not null default 10 check(arrival_margin_minutes between 0 and 120),
 reschedule_hours integer not null default 24 check(reschedule_hours between 1 and 168),
 legal_name text not null default '', business_address text not null default '',
 kvk_number text not null default '', vat_number text not null default '',
 vat_percent numeric(5,2) check(vat_percent between 0 and 100),
 tax_note text not null default '',
 review_url text not null default '' check(review_url='' or review_url ~ '^https://'),
 updated_at timestamptz not null default now()
);
insert into public.operations_settings(id) values(1);
alter table public.operations_settings enable row level security;
create policy operations_admin on public.operations_settings for all to authenticated
 using((select public.is_admin())) with check((select public.is_admin()));
grant select, update on public.operations_settings to authenticated;

create table public.stock_items (
 id uuid primary key default gen_random_uuid(),
 model_id uuid not null references public.device_models(id),
 repair_type_id uuid not null references public.repair_types(id),
 quality_id uuid not null references public.repair_qualities(id),
 on_hand integer not null default 0 check(on_hand between 0 and 100000),
 reserved integer not null default 0 check(reserved between 0 and on_hand),
 minimum integer not null default 2 check(minimum between 0 and 100000),
 unique(model_id,repair_type_id,quality_id)
);
create table public.stock_reservations (
 appointment_id uuid not null references public.appointments(id),
 stock_id uuid not null references public.stock_items(id),
 state text not null check(state in('held','consumed','released')),
 primary key(appointment_id,stock_id)
);
alter table public.stock_items enable row level security;
alter table public.stock_reservations enable row level security;
create policy stock_admin on public.stock_items for select to authenticated using((select public.is_admin()));
create policy reservations_admin on public.stock_reservations for select to authenticated using((select public.is_admin()));
grant select on public.stock_items, public.stock_reservations to authenticated;

create function public.save_stock(p_model uuid,p_repair uuid,p_quality uuid,p_on_hand integer,p_minimum integer)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not coalesce(public.is_admin(),false) then raise exception 'Geen toegang.'; end if;
 perform pg_advisory_xact_lock(540542026);
 -- Missing stock rows are deliberately untracked; adding a row enables enforcement for this combination.
 if not exists(select 1 from public.repair_prices where model_id=p_model and repair_type_id=p_repair and quality_id=p_quality) then
  raise exception 'Deze combinatie bestaat niet in de catalogus.'; end if;
 insert into public.stock_items(model_id,repair_type_id,quality_id,on_hand,minimum)
 values(p_model,p_repair,p_quality,p_on_hand,p_minimum)
 on conflict(model_id,repair_type_id,quality_id) do update set on_hand=excluded.on_hand,minimum=excluded.minimum;

 -- Reconcile existing future bookings while the schedule is locked.
 perform pg_advisory_xact_lock(540542026);
 insert into public.stock_reservations(appointment_id,stock_id,state)
 select distinct a.id,s.id,'held' from public.appointments a
 join public.stock_items s on s.model_id=a.model_id and s.repair_type_id=p_repair and s.quality_id=p_quality
 join public.repair_qualities q on q.id=p_quality
 where a.status in('new','confirmed','picked_up','in_repair') and a.ends_at>now() and a.model_id=p_model
 and exists(select 1 from jsonb_array_elements(a.items) i where (i->>'repairTypeId')::uuid=p_repair
 and (i->>'qualityId'=p_quality::text or (i->>'qualityId' is null and i->>'qualityName'=q.name)))
 on conflict do nothing;
 update public.stock_items si set reserved=(select count(*) from public.stock_reservations sr where sr.stock_id=si.id and sr.state='held')
 where model_id=p_model and repair_type_id=p_repair and quality_id=p_quality;
 -- CHECK reserved <= on_hand also protects concurrent bookings.
end $$;
revoke all on function public.save_stock(uuid,uuid,uuid,integer,integer) from public, anon, authenticated;
grant execute on function public.save_stock(uuid,uuid,uuid,integer,integer) to authenticated;

create function public.sync_appointment_stock() returns trigger
language plpgsql security definer set search_path='' as $$
declare r record; i jsonb; q uuid; wanted text;
begin
 wanted:=case when new.status in('cancelled','expired') then 'released'
              when new.status in('ready','returned') then 'consumed' else 'held' end;
 -- Release / consume old reservations before considering a reopened appointment.
 for r in select sr.*,s.on_hand from public.stock_reservations sr join public.stock_items s on s.id=sr.stock_id
          where sr.appointment_id=new.id order by sr.stock_id for update of sr,s loop
  if r.state='held' and wanted in('released','consumed') then
   update public.stock_items set reserved=reserved-1,
     on_hand=on_hand-case when wanted='consumed' then 1 else 0 end where id=r.stock_id;
   update public.stock_reservations set state=wanted where appointment_id=new.id and stock_id=r.stock_id;
  elsif r.state='consumed' and wanted='held' then
   raise exception 'Onderdelen zijn al verbruikt. Maak voor vervolgwerk een nieuwe afspraak.';
  end if;
 end loop;
 if wanted<>'held' then return new; end if;
 for i in select value from jsonb_array_elements(new.items) loop
  q:=nullif(i->>'qualityId','')::uuid;
  if q is null then
   -- Old bookings stored the quality name only. Resolve it only if unambiguous.
   select case when count(*)=1 then (array_agg(rq.id))[1] end into q
   from public.repair_qualities rq where rq.name=i->>'qualityName';
  end if;
  if q is null and exists(select 1 from public.stock_items where model_id=new.model_id and repair_type_id=(i->>'repairTypeId')::uuid) then
   raise exception 'De kwaliteit van deze oude afspraak is niet eenduidig. Controleer de onderdelen handmatig.';
  end if;
  for r in select * from public.stock_items where model_id=new.model_id
    and repair_type_id=(i->>'repairTypeId')::uuid and quality_id=q order by id for update loop
   if exists(select 1 from public.stock_reservations where appointment_id=new.id and stock_id=r.id and state in('held','consumed')) then continue; end if;
   if r.on_hand-r.reserved<1 then raise exception 'Een gekozen onderdeel is niet op voorraad. Neem contact op voor een afspraak.'; end if;
   update public.stock_items set reserved=reserved+1 where id=r.id;
   insert into public.stock_reservations values(new.id,r.id,'held')
   on conflict(appointment_id,stock_id) do update set state='held';
  end loop;
 end loop;
 return new;
end $$;
create trigger appointments_stock after insert or update of status on public.appointments
 for each row execute function public.sync_appointment_stock();

-- A conservative estimate: straight-line km x 1.3 at the configured speed, plus arrival margin.
-- No public function returns addresses or coordinates of other customers.
create function public.route_minutes(p_lat1 double precision,p_lng1 double precision,p_lat2 double precision,p_lng2 double precision)
returns integer language sql stable security definer set search_path='' as $$
 select case when p_lat1 is null or p_lng1 is null or p_lat2 is null or p_lng2 is null then null
 else ceil(public.km_between(p_lat1,p_lng1,p_lat2,p_lng2)*1.3/o.average_kmh*60)::integer+o.arrival_margin_minutes end
 from public.operations_settings o where id=1
$$;
revoke all on function public.route_minutes(double precision,double precision,double precision,double precision) from public, anon, authenticated;

create function public.route_slot_ok(p_start timestamptz,p_end timestamptz,p_lat double precision,p_lng double precision,p_ignore uuid default null)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare prev public.appointments%rowtype; nxt public.appointments%rowtype; s public.settings%rowtype;
 day date:=(p_start at time zone 'Europe/Amsterdam')::date; minutes integer; opening timestamptz; closing timestamptz;
begin
 select * into s from public.settings where id=1;
 if exists(select 1 from public.appointments a where a.id is distinct from p_ignore and a.status not in('cancelled','expired')
  and tstzrange(a.starts_at,a.blocked_until,'[)') && tstzrange(p_start,p_end+make_interval(mins=>s.travel_buffer_minutes),'[)')) then return false; end if;
 if not (select route_planning from public.operations_settings where id=1) then return true; end if;
 if p_lat is null or p_lng is null then return false; end if;
 select * into prev from public.appointments where id is distinct from p_ignore and status not in('cancelled','expired')
  and (starts_at at time zone 'Europe/Amsterdam')::date=day and ends_at<=p_start order by ends_at desc limit 1;
 select * into nxt from public.appointments where id is distinct from p_ignore and status not in('cancelled','expired')
  and (starts_at at time zone 'Europe/Amsterdam')::date=day and starts_at>=p_end order by starts_at limit 1;
 if prev.id is not null then
  minutes:=public.route_minutes(prev.lat,prev.lng,p_lat,p_lng);
  if minutes is null or prev.ends_at+make_interval(mins=>greatest(minutes,prev.travel_buffer_minutes))>p_start then return false; end if;
 else
  select (day+min(opens_at)) at time zone 'Europe/Amsterdam' into opening from public.work_hours where active and weekday=extract(dow from day)::int;
  minutes:=public.route_minutes(s.start_lat,s.start_lng,p_lat,p_lng);
  if minutes is null or p_start<opening+make_interval(mins=>minutes) then return false; end if;
 end if;
 if nxt.id is not null then
  minutes:=public.route_minutes(p_lat,p_lng,nxt.lat,nxt.lng);
  if minutes is null or p_end+make_interval(mins=>greatest(minutes,s.travel_buffer_minutes))>nxt.starts_at then return false; end if;
 else
  select (day+max(closes_at)) at time zone 'Europe/Amsterdam' into closing from public.work_hours where active and weekday=extract(dow from day)::int;
  minutes:=public.route_minutes(p_lat,p_lng,s.start_lat,s.start_lng);
  if minutes is null or p_end+make_interval(mins=>greatest(minutes,s.travel_buffer_minutes))>closing then return false; end if;
 end if;
 return true;
end $$;
revoke all on function public.route_slot_ok(timestamptz,timestamptz,double precision,double precision,uuid) from public, anon, authenticated;

create function public.operations_slots(p_day date,p_duration integer,p_lat double precision,p_lng double precision,p_ignore uuid default null)
returns table(slot_start timestamptz) language plpgsql stable security definer set search_path='' as $$
declare s public.settings%rowtype; w record; t timestamptz; finish timestamptz;
begin
 if p_day is null or p_day<(now() at time zone 'Europe/Amsterdam')::date or p_day>(now() at time zone 'Europe/Amsterdam')::date+59
  or p_duration is null or p_duration not between 1 and 480 then return; end if;
 select * into s from public.settings where id=1;
 if (select count(*) from public.appointments where id is distinct from p_ignore and status not in('cancelled','expired')
  and (starts_at at time zone 'Europe/Amsterdam')::date=p_day)>=s.max_appointments_per_day then return; end if;
 for w in select * from public.work_hours where active and weekday=extract(dow from p_day)::int order by opens_at loop
  t:=(p_day+w.opens_at) at time zone 'Europe/Amsterdam';
  while t+make_interval(mins=>p_duration)<=(p_day+w.closes_at) at time zone 'Europe/Amsterdam' loop
   finish:=t+make_interval(mins=>p_duration);
   if t>=now()+make_interval(hours=>s.booking_lead_hours)
    and public.route_slot_ok(t,finish,p_lat,p_lng,p_ignore)
    and not exists(select 1 from public.blocked_periods where tstzrange(starts_at,ends_at,'[)') && tstzrange(t,finish,'[)'))
   then slot_start:=t; return next; end if;
   t:=t+make_interval(mins=>s.slot_step_minutes);
  end loop;
 end loop;
end $$;
revoke all on function public.operations_slots(date,integer,double precision,double precision,uuid) from public, anon, authenticated;
-- The ignore-id helper is private; only authenticated rescheduling can exclude an appointment.
create function public.available_route_slots(p_day date,p_duration integer,p_lat double precision,p_lng double precision)
returns table(slot_start timestamptz) language sql stable security definer set search_path='' as $$
 select * from public.operations_slots(p_day,p_duration,p_lat,p_lng)
$$;
revoke all on function public.available_route_slots(date,integer,double precision,double precision) from public, anon, authenticated;
grant execute on function public.available_route_slots(date,integer,double precision,double precision) to anon,authenticated;

create function public.guard_route() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(540542026);
 if new.status in('cancelled','expired') then return new; end if;
 if tg_op='UPDATE' then
  if new.starts_at=old.starts_at and new.ends_at=old.ends_at and new.lat is not distinct from old.lat and new.lng is not distinct from old.lng
   and old.status not in('cancelled','expired') then return new; end if;
 end if;
 if not public.route_slot_ok(new.starts_at,new.ends_at,new.lat,new.lng,new.id) then
  raise exception 'Dit tijdslot past niet meer in de planning. Kies een ander moment.';
 end if;
 return new;
end $$;
create trigger appointments_route before insert or update of starts_at,ends_at,lat,lng,status on public.appointments
 for each row execute function public.guard_route();

create table public.appointment_events (
 id bigint generated always as identity primary key,
 appointment_id uuid not null references public.appointments(id),
 happened_at timestamptz not null default now(), kind text not null, details jsonb not null
);
alter table public.appointment_events enable row level security;
create policy events_admin on public.appointment_events for select to authenticated using((select public.is_admin()));
grant select on public.appointment_events to authenticated;
create function public.log_appointment_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.starts_at<>old.starts_at then
  insert into public.appointment_events(appointment_id,kind,details) values(new.id,'verzet',jsonb_build_object('van',old.starts_at,'naar',new.starts_at));
 end if;
 if new.status<>old.status then
  insert into public.appointment_events(appointment_id,kind,details) values(new.id,'status',jsonb_build_object('van',old.status,'naar',new.status));
 end if;
 return new;
end $$;
create trigger appointments_events after update of starts_at,status on public.appointments for each row execute function public.log_appointment_change();

create function public.reschedule_slots(p_reference text,p_token text,p_day date)
returns table(slot_start timestamptz) language plpgsql stable security definer set search_path='' as $$
declare a public.appointments%rowtype; cutoff integer;
begin
 select * into a from public.appointments where reference=upper(trim(p_reference))
  and (coalesce(public.is_admin(),false) or status_token_hash=encode(extensions.digest(p_token,'sha256'),'hex'));
 if a.id is null or a.status not in('new','confirmed') or a.hold_expires_at is not null then return; end if;
 select reschedule_hours into cutoff from public.operations_settings where id=1;
 if a.starts_at<=now()+make_interval(hours=>case when coalesce(public.is_admin(),false) then 0 else cutoff end) then return; end if;
 return query select * from public.operations_slots(p_day,a.duration_minutes,a.lat,a.lng,a.id);
end $$;
create function public.reschedule_booking(p_reference text,p_token text,p_start timestamptz)
returns void language plpgsql security definer set search_path='' as $$
declare a public.appointments%rowtype;
begin
 perform pg_advisory_xact_lock(540542026);
 select * into a from public.appointments where reference=upper(trim(p_reference))
 and (coalesce(public.is_admin(),false) or status_token_hash=encode(extensions.digest(p_token,'sha256'),'hex')) for update;
 if a.id is null then raise exception 'Deze afspraak is niet gevonden.'; end if;
 if p_start is null or not exists(select 1 from public.reschedule_slots(a.reference,p_token,(p_start at time zone 'Europe/Amsterdam')::date) where slot_start=p_start) then
  raise exception 'Verzetten kan niet naar dit moment. Kies een ander tijdstip of neem contact op.';
 end if;
 -- Address, items, totals, deposits and payments are intentionally unchanged.
 update public.appointments set starts_at=p_start,ends_at=p_start+make_interval(mins=>duration_minutes),updated_at=now() where id=a.id;
end $$;
revoke all on function public.reschedule_slots(text,text,date),public.reschedule_booking(text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.reschedule_slots(text,text,date),public.reschedule_booking(text,text,timestamptz) to anon,authenticated;

create table public.repair_reports (
 appointment_id uuid primary key references public.appointments(id),
 checks jsonb not null default '{}', work_notes text not null default '',
 published boolean not null default false, updated_at timestamptz not null default now(),
 check(length(work_notes)<=4000),
 check(jsonb_typeof(checks)='object')
);
-- Enum validation in the RPC, arbitrary client table writes are never allowed.
alter table public.repair_reports enable row level security;
create policy reports_admin on public.repair_reports for select to authenticated using((select public.is_admin()));
grant select on public.repair_reports to authenticated;
create function public.save_repair_report(p_id uuid,p_checks jsonb,p_notes text,p_published boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not coalesce(public.is_admin(),false) then raise exception 'Geen toegang.'; end if;
 if jsonb_typeof(p_checks)<>'object' or p_checks is null or exists(select 1 from jsonb_each_text(p_checks) where key not in('touchscreen','camera','charging','sound') or value not in('pass','fail','not_tested') or value is null)
  or (select count(*) from jsonb_each(p_checks))<>4 then raise exception 'Controleer de testresultaten.'; end if;
 if p_published and length(trim(p_notes))<5 then raise exception 'Beschrijf het uitgevoerde werk voordat je publiceert.'; end if;
 insert into public.repair_reports values(p_id,p_checks,trim(p_notes),p_published,now())
 on conflict(appointment_id) do update set checks=excluded.checks,work_notes=excluded.work_notes,published=excluded.published,updated_at=now();
end $$;
revoke all on function public.save_repair_report(uuid,jsonb,text,boolean) from public, anon, authenticated;
grant execute on function public.save_repair_report(uuid,jsonb,text,boolean) to authenticated;

create table public.invoice_counters(year integer primary key,last_number integer not null);
create table public.invoices (
 appointment_id uuid primary key references public.appointments(id),
 number text not null unique, issued_at timestamptz not null default now(), snapshot jsonb not null
);
alter table public.invoice_counters enable row level security;
alter table public.invoices enable row level security;
create policy invoices_admin on public.invoices for select to authenticated using((select public.is_admin()));
grant select on public.invoices to authenticated;
create function public.issue_invoice(p_id uuid) returns text language plpgsql security definer set search_path='' as $$
declare a public.appointments%rowtype; o public.operations_settings%rowtype; n integer; nr text; yr integer:=extract(year from now() at time zone 'Europe/Amsterdam')::int; net integer;
begin
 if not coalesce(public.is_admin(),false) then raise exception 'Geen toegang.'; end if;
 perform pg_advisory_xact_lock(540542027);
 select number into nr from public.invoices where appointment_id=p_id;
 if nr is not null then return nr; end if;
 select * into a from public.appointments where id=p_id for update;
 if a.id is null or a.status<>'returned' then raise exception 'Rond de reparatie eerst af met status Teruggebracht.'; end if;
 select * into o from public.operations_settings where id=1;
 if trim(o.legal_name)='' or trim(o.business_address)='' or o.kvk_number !~ '^[0-9]{8}$' or trim(o.vat_number)='' or o.vat_percent is null
  or (o.vat_percent=0 and trim(o.tax_note)='') then raise exception 'Vul eerst alle factuurgegevens en de btw-instellingen in.'; end if;
 insert into public.invoice_counters values(yr,1) on conflict(year) do update set last_number=public.invoice_counters.last_number+1 returning last_number into n;
 nr:=yr::text||'-'||lpad(n::text,6,'0');
 if a.total_cents<>a.repair_total_cents+a.travel_fee_cents or a.repair_total_cents<>(select coalesce(sum((value->>'priceCents')::integer),0) from jsonb_array_elements(a.items)) then raise exception 'De bedragen in deze afspraak sluiten niet aan.'; end if;
 select coalesce(sum(round((value->>'priceCents')::numeric/(1+o.vat_percent/100))),0)::integer into net from jsonb_array_elements(a.items);
 net:=net+round(a.travel_fee_cents/(1+o.vat_percent/100));
 insert into public.invoices(appointment_id,number,snapshot) values(p_id,nr,jsonb_build_object(
  'legalName',o.legal_name,'businessAddress',o.business_address,'kvk',o.kvk_number,'vatNumber',o.vat_number,
  'vatPercent',o.vat_percent,'taxNote',o.tax_note,'customerName',a.customer_name,
  'customerAddress',a.street||' '||a.house_number||', '||a.postcode||' '||a.city,
  'reference',a.reference,'model',a.model_label,'serviceDate',a.starts_at,
  'items',a.items,'travelCents',a.travel_fee_cents,'totalCents',a.total_cents,'netCents',net,'vatCents',a.total_cents-net
 ));
 return nr;
end $$;
revoke all on function public.issue_invoice(uuid) from public, anon, authenticated;
grant execute on function public.issue_invoice(uuid) to authenticated;

create function public.booking_documents(p_reference text,p_token text)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('reference',a.reference,'customerName',a.customer_name,'model',a.model_label,
 'report',(select jsonb_build_object('checks',r.checks,'notes',r.work_notes,'updatedAt',r.updated_at) from public.repair_reports r where r.appointment_id=a.id and (r.published or coalesce(public.is_admin(),false))),
 'invoice',(select jsonb_build_object('number',i.number,'issuedAt',i.issued_at,'snapshot',i.snapshot) from public.invoices i where i.appointment_id=a.id))
 from public.appointments a where a.reference=upper(trim(p_reference))
 and (coalesce(public.is_admin(),false) or a.status_token_hash=encode(extensions.digest(p_token,'sha256'),'hex'))
$$;
revoke all on function public.booking_documents(text,text) from public, anon, authenticated;
grant execute on function public.booking_documents(text,text) to anon,authenticated;

create table public.site_photos (
 id uuid primary key default gen_random_uuid(), image_url text not null check(image_url ~ '^https://'),
 alt text not null check(length(alt) between 5 and 200), caption text not null default '' check(length(caption)<=300),
 published boolean not null default false, consent_confirmed boolean not null default false, created_at timestamptz not null default now(),
 check(not published or consent_confirmed)
);
alter table public.site_photos enable row level security;
create policy photos_read on public.site_photos for select to anon,authenticated using(published and consent_confirmed);
create policy photos_admin on public.site_photos for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
grant select on public.site_photos to anon,authenticated;
grant insert,update,delete on public.site_photos to authenticated;
create function public.review_link() returns text language sql stable security definer set search_path='' as $$
 select nullif(review_url,'') from public.operations_settings where id=1
$$;
revoke all on function public.review_link() from public, anon, authenticated;
grant execute on function public.review_link() to anon,authenticated;

-- New bookings carry the quality id for reliable inventory reservation.
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
      'qualityId', v_item->>'qualityId',
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

revoke all on function public.create_booking(uuid, jsonb, text, text, text, text, text, text, text, text, double precision, double precision, numeric, timestamptz, text, boolean) from public, anon, authenticated;
grant execute on function public.create_booking(uuid, jsonb, text, text, text, text, text, text, text, text, double precision, double precision, numeric, timestamptz, text, boolean) to anon, authenticated;


revoke all on function public.sync_appointment_stock(), public.guard_route(), public.log_appointment_change() from public,anon,authenticated;

create function public.stock_available_options(p_model uuid)
returns table(repair_type_id uuid,quality_id uuid) language sql stable security definer set search_path='' as $$
 select rp.repair_type_id,rp.quality_id from public.repair_prices rp
 join public.device_models m on m.id=rp.model_id and m.active
 join public.brands b on b.id=m.brand_id and b.active
 join public.repair_types rt on rt.id=rp.repair_type_id and rt.active
 join public.repair_qualities q on q.id=rp.quality_id and q.active
 left join public.stock_items s on s.model_id=rp.model_id and s.repair_type_id=rp.repair_type_id and s.quality_id=rp.quality_id
 where rp.model_id=p_model and rp.active and (s.id is null or s.on_hand>s.reserved)
$$;
revoke all on function public.stock_available_options(uuid) from public,anon,authenticated;
grant execute on function public.stock_available_options(uuid) to anon,authenticated;
