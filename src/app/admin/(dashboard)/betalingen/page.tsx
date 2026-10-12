import { ActionForm } from "@/components/admin/action-form";
import { Card, Checkbox, Field, inputClass } from "@/components/admin/fields";
import { requireAdmin } from "@/lib/auth";
import { centsToEuroInput } from "@/lib/money";
import { savePaymentSettings } from "./actions";

export const metadata = {
  title: "Betalingen | 054repairs admin",
  robots: { index: false, follow: false },
};

export default async function PaymentSettingsPage() {
  const { supabase } = await requireAdmin();

  const { data: settings } = await supabase
    .from("settings")
    .select("deposit_type, deposit_value, allow_full_prepay, full_refund_hours, late_cancel_refund_percent")
    .eq("id", 1)
    .single();

  if (!settings) {
    return <p className="text-navy-600">Instellingen konden niet worden geladen.</p>;
  }

  const isFixed = settings.deposit_type === "fixed";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">Betalingen</h1>
        <p className="mt-1 text-sm text-navy-600">
          Hoeveel een klant vooraf betaalt, en wat er gebeurt bij annuleren. Het restbedrag betaalt de klant pin of contant bij het terugbrengen.
        </p>
      </header>

      <Card title="Aanbetaling">
        <ActionForm action={savePaymentSettings}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Soort aanbetaling">
              <select name="deposit_type" defaultValue={settings.deposit_type} className={inputClass}>
                <option value="percent">Percentage van het totaal</option>
                <option value="fixed">Vast bedrag</option>
              </select>
            </Field>
            <Field label={isFixed ? "Bedrag (€)" : "Percentage (%)"} hint={isFixed ? "Bijvoorbeeld 25,00" : "Bijvoorbeeld 30"}>
              <input
                name="deposit_value"
                inputMode="decimal"
                defaultValue={isFixed ? centsToEuroInput(settings.deposit_value) : String(settings.deposit_value)}
                required
                className={inputClass}
              />
            </Field>
          </div>

          <div className="mt-5">
            <Checkbox
              name="allow_full_prepay"
              label="Klant mag het volledige bedrag vooraf betalen"
              defaultChecked={settings.allow_full_prepay}
            />
          </div>

          <h3 className="mt-8 text-sm font-semibold text-navy-900">Annuleren</h3>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <Field label="Volledig terug tot (uren voor de afspraak)">
              <input name="full_refund_hours" type="number" min={0} defaultValue={settings.full_refund_hours} required className={inputClass} />
            </Field>
            <Field label="Restitutie daarna (%)" hint="Het deel van de betaling dat de klant terugkrijgt na die termijn.">
              <input name="late_cancel_refund_percent" type="number" min={0} max={100} defaultValue={settings.late_cancel_refund_percent} required className={inputClass} />
            </Field>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
