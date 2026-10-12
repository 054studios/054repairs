-- 054repairs: initial schema
-- Public (anon) users may only read active catalog rows.
-- Everything else is admin-only, or reachable only with the service role on the server.

-- Admins: allowlist of Supabase Auth users allowed to manage the shop
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a where a.user_id = (select auth.uid())
  );
$$;

-- Settings (singleton row). Admin only: the start address is private.
create table public.settings (
  id smallint primary key default 1 check (id = 1),
  business_name text not null default '054repairs',
  phone text,
  email text,
  start_address text not null default '',
  start_lat double precision,
  start_lng double precision,
  free_travel_km numeric(6, 1) not null default 50 check (free_travel_km >= 0),
  max_travel_km numeric(6, 1) not null default 150 check (max_travel_km > 0),
  price_per_km_cents integer not null default 100 check (price_per_km_cents >= 0),
  travel_distance_mode text not null default 'round_trip'
    check (travel_distance_mode in ('round_trip', 'one_way')),
  deposit_type text not null default 'percent' check (deposit_type in ('fixed', 'percent')),
  deposit_value integer not null default 30 check (deposit_value >= 0),
  allow_full_prepay boolean not null default true,
  mollie_mode text not null default 'test' check (mollie_mode in ('test', 'live')),
  full_refund_hours integer not null default 24 check (full_refund_hours >= 0),
  late_cancel_refund_percent integer not null default 50
    check (late_cancel_refund_percent between 0 and 100),
  travel_buffer_minutes integer not null default 0 check (travel_buffer_minutes >= 0),
  slot_step_minutes integer not null default 30 check (slot_step_minutes > 0),
  booking_lead_hours integer not null default 24 check (booking_lead_hours >= 0),
  max_appointments_per_day integer not null default 6 check (max_appointments_per_day > 0),
  updated_at timestamptz not null default now()
);

insert into public.settings (id) values (1);

-- Encrypted secrets (Mollie API key). RLS is on with NO policies:
-- only the service role (server) can read or write this table.
create table public.payment_secrets (
  id smallint primary key default 1 check (id = 1),
  mollie_api_key_ciphertext text,
  mollie_api_key_hint text,            -- last 4 characters, shown in the admin UI
  updated_at timestamptz not null default now()
);

insert into public.payment_secrets (id) values (1);

-- Catalog
create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.device_models (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  name text not null,
  slug text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (brand_id, slug)
);

create table public.repair_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes > 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.repair_qualities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Price for one model + repair + quality. duration_minutes overrides the repair default when set.
create table public.repair_prices (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.device_models (id) on delete cascade,
  repair_type_id uuid not null references public.repair_types (id) on delete cascade,
  quality_id uuid not null references public.repair_qualities (id) on delete cascade,
  price_cents integer not null check (price_cents >= 0),
  duration_minutes integer check (duration_minutes > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (model_id, repair_type_id, quality_id)
);

-- Availability
-- Weekly opening windows. weekday: 0 = Sunday ... 6 = Saturday. Several windows per day allowed (lunch break).
create table public.work_hours (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  active boolean not null default true,
  check (closes_at > opens_at)
);

-- Days or periods that are closed (holidays, blocked times).
create table public.blocked_periods (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  check (ends_at > starts_at)
);

-- Appointments (admin only; customers use a status link through the server)
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,            -- short code shown to the customer, e.g. 054-A7K2QX
  status_token_hash text not null unique,    -- sha256 of the token in the status link

  status text not null default 'new'
    check (status in ('new', 'confirmed', 'picked_up', 'in_repair', 'ready', 'returned', 'cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'deposit_paid', 'paid', 'refunded')),
  payment_choice text not null default 'deposit' check (payment_choice in ('deposit', 'full')),
  balance_method text check (balance_method in ('pin', 'cash', 'mollie')),

  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  customer_note text,

  street text not null,
  house_number text not null,
  postcode text not null,
  city text not null,
  lat double precision,
  lng double precision,
  travel_km numeric(7, 1) not null default 0,
  travel_fee_cents integer not null default 0 check (travel_fee_cents >= 0),

  -- Snapshot, so later catalog changes never alter an existing booking
  model_id uuid references public.device_models (id) on delete set null,
  model_label text not null,
  items jsonb not null,                      -- [{repairTypeId, name, qualityName, priceCents, durationMinutes}]
  duration_minutes integer not null check (duration_minutes > 0),

  repair_total_cents integer not null check (repair_total_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  deposit_cents integer not null default 0 check (deposit_cents >= 0),
  paid_cents integer not null default 0 check (paid_cents >= 0),

  -- Time slot: pickup at starts_at, device back at ends_at
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  hold_expires_at timestamptz,               -- unpaid bookings release their slot after this moment

  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (ends_at > starts_at),
  check (ends_at - starts_at = make_interval(mins => duration_minutes))
);

-- Two active appointments may never overlap. Protects against double bookings under concurrent requests.
alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (tstzrange(starts_at, ends_at, '[)') with &&)
  where (status <> 'cancelled');

create index appointments_starts_at_idx on public.appointments (starts_at);
create index appointments_status_idx on public.appointments (status);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  kind text not null check (kind in ('deposit', 'full', 'balance', 'refund')),
  amount_cents integer not null check (amount_cents > 0),
  method text,                                -- ideal, creditcard, pin, cash, ...
  provider text not null default 'mollie' check (provider in ('mollie', 'pin', 'cash')),
  provider_payment_id text unique,            -- Mollie payment id, null for pin/cash
  status text not null default 'open'
    check (status in ('open', 'pending', 'paid', 'failed', 'expired', 'canceled', 'refunded')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index payments_appointment_idx on public.payments (appointment_id);

-- Row Level Security
alter table public.admins enable row level security;
alter table public.settings enable row level security;
alter table public.payment_secrets enable row level security;
alter table public.brands enable row level security;
alter table public.device_models enable row level security;
alter table public.repair_types enable row level security;
alter table public.repair_qualities enable row level security;
alter table public.repair_prices enable row level security;
alter table public.work_hours enable row level security;
alter table public.blocked_periods enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;

create policy "admins: admin read" on public.admins
  for select to authenticated using ((select public.is_admin()));

-- Public catalog: anyone can read active rows
create policy "brands: public read active" on public.brands
  for select to anon, authenticated using (active);
create policy "device_models: public read active" on public.device_models
  for select to anon, authenticated using (active);
create policy "repair_types: public read active" on public.repair_types
  for select to anon, authenticated using (active);
create policy "repair_qualities: public read active" on public.repair_qualities
  for select to anon, authenticated using (active);
create policy "repair_prices: public read active" on public.repair_prices
  for select to anon, authenticated using (active);
create policy "work_hours: public read active" on public.work_hours
  for select to anon, authenticated using (active);

-- Admin: full control over everything the dashboard manages
create policy "settings: admin all" on public.settings
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "brands: admin all" on public.brands
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "device_models: admin all" on public.device_models
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "repair_types: admin all" on public.repair_types
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "repair_qualities: admin all" on public.repair_qualities
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "repair_prices: admin all" on public.repair_prices
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "work_hours: admin all" on public.work_hours
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "blocked_periods: admin all" on public.blocked_periods
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "appointments: admin all" on public.appointments
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "payments: admin all" on public.payments
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- payment_secrets has no policies on purpose: only the service role can access it.

-- Seed: iPhone only for now. Prices are added from the admin dashboard.
insert into public.brands (name, slug, sort_order) values ('Apple iPhone', 'iphone', 1);

insert into public.device_models (brand_id, name, slug, sort_order)
select b.id, m.name, m.slug, m.sort_order
from public.brands b
cross join (values
  ('iPhone 12', 'iphone-12', 1),
  ('iPhone 13', 'iphone-13', 2),
  ('iPhone 14', 'iphone-14', 3),
  ('iPhone 15', 'iphone-15', 4),
  ('iPhone 16', 'iphone-16', 5),
  ('iPhone 17', 'iphone-17', 6)
) as m (name, slug, sort_order)
where b.slug = 'iphone';

insert into public.repair_types (name, description, duration_minutes, sort_order) values
  ('Scherm vervangen', 'Glas en display vervangen', 45, 1),
  ('Batterij vervangen', 'Nieuwe accu', 30, 2),
  ('Laadpoort repareren', 'Lightning of USB-C laadpoort', 45, 3),
  ('Achtercamera vervangen', 'Achterste camera-module', 45, 4),
  ('Diagnose', 'Onderzoek van het probleem', 30, 5);

insert into public.repair_qualities (name, description, sort_order) values
  ('Standaard', 'Reserveonderdeel van goede kwaliteit', 1),
  ('Premium', 'Origineel of gelijkwaardig onderdeel', 2);

insert into public.work_hours (weekday, opens_at, closes_at) values
  (1, '09:00', '18:00'),
  (2, '09:00', '18:00'),
  (3, '09:00', '18:00'),
  (4, '09:00', '18:00'),
  (5, '09:00', '18:00'),
  (6, '10:00', '16:00');
