import { ActionForm } from "@/components/admin/action-form";
import { AffixInput, Card, CardSection, Checkbox, Field, Select } from "@/components/admin/fields";
import { Notice } from "@/components/admin/notice";
import { PageHeader } from "@/components/admin/page-header";
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
    return (
      <div>
        <PageHeader title="Betalingen" />
        <Notice tone="bad" role="alert">
          Instellingen konden niet worden geladen. Ververs de pagina om het opnieuw te proberen.
        </Notice>
      </div>
    );
  }

  const isFixed = settings.deposit_type === "fixed";

  return (
    <div>
      <PageHeader
        title="Betalingen"
        description="Hoeveel een klant vooraf betaalt, en wat er gebeurt bij annuleren. Het restbedrag betaalt de klant pin of contant bij het terugbrengen."
      />

      <Card title="Aanbetaling" className="max-w-3xl">
        <ActionForm action={savePaymentSettings}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Soort aanbetaling">
              <Select name="deposit_type" defaultValue={settings.deposit_type}>
                <option value="percent">Percentage van het totaal</option>
                <option value="fixed">Vast bedrag</option>
              </Select>
            </Field>
            <Field
              label={isFixed ? "Bedrag" : "Percentage"}
              hint={isFixed ? "Bijvoorbeeld 25,00" : "Bijvoorbeeld 30"}
            >
              <AffixInput
                name="deposit_value"
                inputMode="decimal"
                prefix={isFixed ? "€" : undefined}
                suffix={isFixed ? undefined : "%"}
                defaultValue={isFixed ? centsToEuroInput(settings.deposit_value) : String(settings.deposit_value)}
                required
              />
            </Field>
          </div>

          <div className="mt-2">
            <Checkbox
              name="allow_full_prepay"
              label="Klant mag het volledige bedrag vooraf betalen"
              defaultChecked={settings.allow_full_prepay}
            />
          </div>

          <CardSection title="Annuleren">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Volledig terug tot" hint="Aantal uur voor de afspraak.">
                <AffixInput
                  name="full_refund_hours"
                  type="number"
                  min={0}
                  suffix="uur"
                  defaultValue={settings.full_refund_hours}
                  required
                />
              </Field>
              <Field label="Restitutie daarna" hint="Het deel van de betaling dat de klant terugkrijgt na die termijn.">
                <AffixInput
                  name="late_cancel_refund_percent"
                  type="number"
                  min={0}
                  max={100}
                  suffix="%"
                  defaultValue={settings.late_cancel_refund_percent}
                  required
                />
              </Field>
            </div>
          </CardSection>
        </ActionForm>
      </Card>
    </div>
  );
}
