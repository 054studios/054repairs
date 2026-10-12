import { ActionForm } from "@/components/admin/action-form";
import { Card, Field, inputClass } from "@/components/admin/fields";
import { requireAdmin } from "@/lib/auth";
import { centsToEuroInput, formatEuro } from "@/lib/money";
import { saveTravelSettings } from "./actions";

export const metadata = {
  title: "Voorrijkosten | 054repairs admin",
  robots: { index: false, follow: false },
};

export default async function TravelFeePage() {
  const { supabase } = await requireAdmin();

  const { data: settings } = await supabase
    .from("settings")
    .select("start_address, start_lat, free_travel_km, max_travel_km, price_per_km_cents, travel_distance_mode")
    .eq("id", 1)
    .single();

  if (!settings) {
    return <p className="text-navy-600">Instellingen konden niet worden geladen.</p>;
  }

  // Example for a customer 80 km away, so the rule is clear before saving.
  const exampleKm = 80;
  const factor = settings.travel_distance_mode === "round_trip" ? 2 : 1;
  const billableKm = Math.max(0, exampleKm - Number(settings.free_travel_km)) * factor;
  const exampleCents = Math.round(billableKm * settings.price_per_km_cents);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">Voorrijkosten</h1>
        <p className="mt-1 text-sm text-navy-600">
          Klanten binnen de gratis afstand betalen niets extra. Daarbuiten rekenen we per kilometer.
        </p>
      </header>

      <Card title="Startpunt en tarief">
        <ActionForm action={saveTravelSettings}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Startadres" hint="Vanaf dit adres meten we de afstand. Zoek naar een volledig adres." className="md:col-span-2">
              <input name="start_address" defaultValue={settings.start_address} required className={inputClass} />
            </Field>
            <Field label="Gratis kilometers" hint="Tot deze afstand rekenen we niets extra.">
              <input name="free_travel_km" inputMode="decimal" defaultValue={String(settings.free_travel_km)} className={inputClass} />
            </Field>
            <Field label="Maximale afstand (km)" hint="Verder dan dit bieden we geen service aan.">
              <input name="max_travel_km" inputMode="decimal" defaultValue={String(settings.max_travel_km)} className={inputClass} />
            </Field>
            <Field label="Prijs per kilometer (€)">
              <input name="price_per_km" inputMode="decimal" defaultValue={centsToEuroInput(settings.price_per_km_cents)} className={inputClass} />
            </Field>
            <Field label="Berekening">
              <select name="travel_distance_mode" defaultValue={settings.travel_distance_mode} className={inputClass}>
                <option value="round_trip">Heen en terug (we rijden twee keer)</option>
                <option value="one_way">Enkele reis</option>
              </select>
            </Field>
          </div>
        </ActionForm>

        <div className="mt-6 rounded-xl bg-navy-50 p-4 text-sm text-navy-800">
          <p className="font-medium text-navy-950">Voorbeeld</p>
          <p className="mt-1">
            Een klant op {exampleKm} km betaalt {formatEuro(exampleCents)} voorrijkosten.
            Berekening: ({exampleKm} − {String(settings.free_travel_km)} km gratis) × {factor}{" "}
            {factor === 2 ? "(heen en terug)" : "(enkele reis)"} × {formatEuro(settings.price_per_km_cents)} per km.
          </p>
        </div>
      </Card>
    </div>
  );
}
