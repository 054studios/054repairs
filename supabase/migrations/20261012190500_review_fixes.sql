-- Fixes from the phase 1 security review.
-- Applied step by step on the remote project. The pg_cron job needs the pg_cron extension.

-- 1. Travel buffer. Each appointment blocks its slot plus the travel buffer after it.
alter table public.appointments
  add column if not exists travel_buffer_minutes integer not null default 0 check (travel_buffer_minutes >= 0),
  add column if not exists blocked_until timestamptz;

create or replace function public.set_blocked_until()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.blocked_until := new.ends_at + make_interval(mins => new.travel_buffer_minutes);
  return new;
end;
$$;

create trigger appointments_set_blocked_until
  before insert or update of ends_at, travel_buffer_minutes on public.appointments
  for each row execute function public.set_blocked_until();

alter table public.appointments
  alter column blocked_until set not null,
  add constraint appointments_blocked_until_after_end check (blocked_until >= ends_at);

-- 2. Expired holds. A new status releases the slot when the customer has not paid in time.
alter table public.appointments drop constraint appointments_status_check,
  add constraint appointments_status_check
    check (status in ('new', 'confirmed', 'picked_up', 'in_repair', 'ready', 'returned', 'cancelled', 'expired'));

alter table public.appointments drop constraint appointments_no_overlap,
  add constraint appointments_no_overlap
    exclude using gist (tstzrange(starts_at, blocked_until, '[)') with &&)
    where (status not in ('cancelled', 'expired'));

create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'expire-unpaid-holds',
  '* * * * *',
  $$
    update public.appointments
    set status = 'expired',
        cancelled_at = now(),
        cancel_reason = 'Betaling niet op tijd afgerond',
        updated_at = now()
    where status = 'new'
      and payment_status = 'unpaid'
      and hold_expires_at < now();
  $$
);

-- 3. Inactive parents hide their children from the public API.
alter policy "device_models: public read active" on public.device_models
  using (active and exists (select 1 from public.brands b where b.id = brand_id and b.active));

alter policy "repair_prices: public read active" on public.repair_prices
  using (
    active
    and exists (select 1 from public.device_models m where m.id = model_id and m.active)
    and exists (select 1 from public.repair_types t where t.id = repair_type_id and t.active)
    and exists (select 1 from public.repair_qualities q where q.id = quality_id and q.active)
  );

-- 4. Financial history. Appointments with payments cannot be deleted.
alter table public.payments drop constraint payments_appointment_id_fkey,
  add constraint payments_appointment_id_fkey
    foreign key (appointment_id) references public.appointments (id) on delete restrict;

-- Admins can read payments and record cash or PIN payments. They cannot change or delete them.
-- Mollie payments are written by the server with the service role.
alter policy "payments: admin all" on public.payments
  using ((select public.is_admin()))
  with check ((select public.is_admin()) and provider in ('pin', 'cash'));

create policy payments_admin_read on public.payments
  for select to authenticated using ((select public.is_admin()));

revoke update, delete on public.payments from anon, authenticated;
