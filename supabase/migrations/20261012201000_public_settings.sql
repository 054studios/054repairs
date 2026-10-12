-- Public, non-sensitive business settings for the website. The start address is not included.
create or replace function public.public_settings()
returns jsonb language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'businessName', s.business_name,
    'phone', s.phone,
    'email', s.email,
    'freeTravelKm', s.free_travel_km,
    'maxTravelKm', s.max_travel_km,
    'pricePerKmCents', s.price_per_km_cents,
    'travelDistanceMode', s.travel_distance_mode,
    'depositType', s.deposit_type,
    'depositValue', s.deposit_value,
    'allowFullPrepay', s.allow_full_prepay,
    'fullRefundHours', s.full_refund_hours,
    'lateCancelRefundPercent', s.late_cancel_refund_percent,
    'travelBufferMinutes', s.travel_buffer_minutes,
    'slotStepMinutes', s.slot_step_minutes,
    'bookingLeadHours', s.booking_lead_hours,
    'hasStartPoint', (s.start_lat is not null and s.start_lng is not null)
  )
  from public.settings s where s.id = 1;
$$;

revoke all on function public.public_settings() from public;
grant execute on function public.public_settings() to anon, authenticated;

-- Estimated driving distance from the start point, in km, without exposing the start point.
-- Straight-line distance times 1.3. Replace with an exact route once a routing service is connected.
create or replace function public.estimate_travel_km(p_lat double precision, p_lng double precision)
returns numeric language sql stable security definer set search_path = ''
as $$
  select round((public.km_between(s.start_lat, s.start_lng, p_lat, p_lng) * 1.3)::numeric, 1)
  from public.settings s
  where s.id = 1 and s.start_lat is not null and s.start_lng is not null;
$$;

revoke all on function public.estimate_travel_km(double precision, double precision) from public;
grant execute on function public.estimate_travel_km(double precision, double precision) to anon, authenticated;
