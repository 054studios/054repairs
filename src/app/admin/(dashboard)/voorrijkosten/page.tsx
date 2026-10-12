import { ActionForm } from "@/components/admin/action-form";
import { AffixInput, Card, Field, inputClass, Select } from "@/components/admin/fields";
import { Notice } from "@/components/admin/notice";
import { PageHeader } from "@/components/admin/page-header";
import { insetClass } from "@/components/ui/styles";
import { formatKm } from "@/lib/booking/format";
import { requireAdmin } from "@/lib/auth";
import { centsToEuroInput, formatEuro } from "@/lib/money";
import { saveTravelSettings } from "./actions";

export const metadata = {
  title: "Voorrijkosten | 054repairs admin",
  robots: { index: false, follow: false },
};

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-2 ${strong ? "border-t border-line-strong pt-3" : ""}`}>
      <dt className={strong ? "font-medium text-steel-50" : "text-steel-400"}>{label}</dt>
      <dd className={`figures text-right ${strong ? "font-display text-lg font-semibold text-steel-50" : "text-steel-100"}`}>
        {value}
      </dd>
    </div>
  );
}

export default async function TravelFeePage() {
  const { supabase } = await requireAdmin();

  const { data: settings } = await supabase
    .from("settings")
    .select("start_address, start_lat, free_travel_km, max_travel_km, price_per_km_cents, travel_distance_mode")
    .eq("id", 1)
    .single();

  if (!settings) {
    return (
      <div>
        <PageHeader title="Voorrijkosten" />
        <Notice tone="bad" role="alert">
          Instellingen konden niet worden geladen. Ververs de pagina om het opnieuw te proberen.
        </Notice>
      </div>
    );
  }

  // Example for a customer 80 km away, so the rule is clear before saving.
  const exampleKm = 80;
  const freeKm = Number(settings.free_travel_km);
  const maxKm = Number(settings.max_travel_km);
  const factor = settings.travel_distance_mode === "round_trip" ? 2 : 1;
  const billableKm = Math.max(0, exampleKm - freeKm) * factor;
  const exampleCents = Math.round(billableKm * settings.price_per_km_cents);

  // The service area as a static bar: the free part in a tint of the light, the example as a stop.
  const freeShare = maxKm > 0 ? Math.min(100, (freeKm / maxKm) * 100) : 0;
  const exampleShare = maxKm > 0 ? Math.min(100, (exampleKm / maxKm) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Voorrijkosten"
        description="Klanten binnen de gratis afstand betalen niets extra. Daarbuiten rekenen we per kilometer."
      />

      <div className="grid gap-4 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <Card title="Startpunt en tarief">
          <ActionForm action={saveTravelSettings}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Startadres"
                hint="Vanaf dit adres meten we de afstand. Vul een volledig adres in."
                className="sm:col-span-2"
              >
                <input name="start_address" defaultValue={settings.start_address} required className={inputClass} />
              </Field>
              <Field label="Gratis kilometers" hint="Tot deze afstand rekenen we niets extra.">
                <AffixInput name="free_travel_km" inputMode="decimal" suffix="km" defaultValue={String(settings.free_travel_km)} />
              </Field>
              <Field label="Maximale afstand" hint="Verder dan dit bieden we geen service aan.">
                <AffixInput name="max_travel_km" inputMode="decimal" suffix="km" defaultValue={String(settings.max_travel_km)} />
              </Field>
              <Field label="Prijs per kilometer">
                <AffixInput
                  name="price_per_km"
                  inputMode="decimal"
                  prefix="€"
                  defaultValue={centsToEuroInput(settings.price_per_km_cents)}
                />
              </Field>
              <Field label="Berekening">
                <Select name="travel_distance_mode" defaultValue={settings.travel_distance_mode}>
                  <option value="round_trip">Heen en terug (we rijden twee keer)</option>
                  <option value="one_way">Enkele reis</option>
                </Select>
              </Field>
            </div>
          </ActionForm>
        </Card>

        <section className={`${insetClass} p-4 sm:p-5`}>
          <h2 className="font-display text-base font-semibold tracking-[-0.015em] text-steel-50">
            Voorbeeld: klant op {exampleKm} km
          </h2>
          <p className="mt-1 text-sm text-steel-400">Met de opgeslagen instellingen.</p>

          <div className="mt-5" aria-hidden="true">
            <div className="relative h-1.5 rounded-full bg-ink-700">
              <div className="absolute inset-y-0 left-0 rounded-full bg-cyan-400/35" style={{ width: `${freeShare}%` }} />
              <div
                className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400 bg-ink-950"
                style={{ left: `${exampleShare}%` }}
              />
            </div>
            <div className="figures mt-2 flex justify-between gap-3 text-xs text-steel-400">
              <span>Gratis tot {formatKm(freeKm)}</span>
              <span>Maximaal {formatKm(maxKm)}</span>
            </div>
          </div>

          <dl className="mt-4 text-sm">
            <Line label="Afstand" value={formatKm(exampleKm)} />
            <Line label="Gratis" value={formatKm(freeKm)} />
            <Line
              label={factor === 2 ? "Berekend, heen en terug" : "Berekend, enkele reis"}
              value={formatKm(billableKm)}
            />
            <Line label="Prijs per km" value={formatEuro(settings.price_per_km_cents)} />
            <Line label="Voorrijkosten" value={formatEuro(exampleCents)} strong />
          </dl>
        </section>
      </div>
    </div>
  );
}
