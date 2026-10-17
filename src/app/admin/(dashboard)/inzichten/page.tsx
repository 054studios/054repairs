import { addDays, amsterdamDay } from "@/lib/booking/format";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/page-header";
import { Notice } from "@/components/admin/notice";
import { panelClass } from "@/components/ui/styles";
export const metadata = {
  title: "Boekingsinzichten | 054repairs admin",
  robots: { index: false, follow: false },
};
const labels: Record<string, string> = {
  step_1: "1 · Model",
  step_2: "2 · Reparatie",
  step_3: "3 · Adres",
  step_4: "4 · Tijdstip",
  step_5: "5 · Gegevens",
  step_6: "6 · Controleren",
  booking_created: "Boekingen vastgelegd",
  booking_failed: "Boeken mislukt",
  payment_failed: "Betaling mislukt",
  payment_paid: "Betalingen ontvangen",
};
export default async function InsightsPage() {
  const { supabase } = await requireAdmin();
  const since = addDays(amsterdamDay(new Date()), -29);
  const { data, error } = await supabase
    .from("funnel_daily")
    .select("event,total")
    .gte("day", since);
  const enabled = process.env.NEXT_PUBLIC_FUNNEL_ENABLED === "true";
  const totals = new Map<string, number>();
  for (const row of data ?? [])
    totals.set(row.event, (totals.get(row.event) ?? 0) + Number(row.total));
  return (
    <div>
      <PageHeader
        title="Boekingsinzichten"
        description="Opgetelde gebeurtenissen in de afgelopen 30 dagen."
      />
      {(!enabled || error) && (
        <Notice tone="warn" className="mb-6">
          {!enabled
            ? "Metingen staan uit. Activeer ze pas na het toepassen van de database-upgrade en het controleren van de privacytekst."
            : "Metingen konden niet worden geladen. Controleer de database-upgrade."}
        </Notice>
      )}
      <p className="mb-6 max-w-2xl leading-relaxed text-steel-400">
        Dit zijn aantallen gebeurtenissen, geen unieke bezoekers of
        conversiepercentages. Dezelfde bezoeker kan meerdere boekingssessies
        starten. Er worden geen klantgegevens, IP-adressen, persoonlijke
        statuslinks of bezoeker-ID’s in deze metingen opgeslagen.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(labels).map(([event, label]) => (
          <div key={event} className={`${panelClass} p-5`}>
            <p className="text-sm text-steel-400">{label}</p>
            <p className="figures mt-3 text-3xl font-semibold">
              {error ? "—" : (totals.get(event) ?? 0).toLocaleString("nl-NL")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
