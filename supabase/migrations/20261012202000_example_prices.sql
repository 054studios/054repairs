-- Example prices so the site can be tested. Replace them in the admin dashboard (Catalogus).
-- Based on Apple's official prices (May 2026), set lower to match independent repairers. Not verified.
insert into public.repair_prices (model_id, repair_type_id, quality_id, price_cents)
select m.id, rt.id, q.id,
  case rt.name
    when 'Scherm vervangen' then
      (case when m.slug in ('iphone-12', 'iphone-13') then 11900
            when m.slug in ('iphone-14', 'iphone-15') then 14900
            else 19900 end) + case when q.name = 'Premium' then 10000 else 0 end
    when 'Batterij vervangen' then 5900 + case when q.name = 'Premium' then 2000 else 0 end
    when 'Laadpoort repareren' then 7900 + case when q.name = 'Premium' then 2000 else 0 end
    when 'Achtercamera vervangen' then
      (case when m.slug in ('iphone-12', 'iphone-13') then 9900 else 14900 end)
      + case when q.name = 'Premium' then 10000 else 0 end
    when 'Diagnose' then 2500
  end
from public.device_models m
cross join public.repair_types rt
cross join public.repair_qualities q
where m.slug in ('iphone-12', 'iphone-13', 'iphone-14', 'iphone-15', 'iphone-16', 'iphone-17')
  and not (rt.name = 'Diagnose' and q.name = 'Premium')
on conflict (model_id, repair_type_id, quality_id) do nothing;
