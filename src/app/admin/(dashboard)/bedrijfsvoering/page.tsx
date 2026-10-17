import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/page-header";
import { Card, Field, inputClass } from "@/components/admin/fields";
import { ActionForm } from "@/components/admin/action-form";
import { OperationsNotice } from "@/components/admin/operations-notice";
import { saveOperations } from "./actions";
export const metadata = { title: "Bedrijfsvoering | 054repairs admin" };
export default async function Page() {
  const { supabase } = await requireAdmin();
  const { data: s, error } = await supabase
    .from("operations_settings")
    .select("*")
    .eq("id", 1)
    .single();
  return (
    <div>
      <PageHeader
        title="Bedrijfsvoering"
        description="Reistijd, klantbeheer, factuurgegevens en je reviewlink."
      />
      {error || !s ? (
        <OperationsNotice />
      ) : (
        <ActionForm action={saveOperations}>
          <div className="grid gap-6 xl:grid-cols-2">
            <Card
              title="Reistijd en verzetten"
              description="De reistijd is een schatting op basis van afstand, gemiddelde snelheid en aankomstmarge. Controleer je werkdag op verkeer en parkeren."
            >
              <label className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  name="route_planning"
                  defaultChecked={s.route_planning}
                />
                Reistijd tussen adressen meenemen
              </label>
              <div className="mt-4 space-y-4">
                <Field label="Gemiddelde snelheid (km/u)">
                  <input
                    className={inputClass}
                    type="number"
                    name="average_kmh"
                    min="10"
                    max="130"
                    defaultValue={s.average_kmh}
                    required
                  />
                </Field>
                <Field label="Extra aankomstmarge (minuten)">
                  <input
                    className={inputClass}
                    type="number"
                    name="arrival_margin_minutes"
                    min="0"
                    max="120"
                    defaultValue={s.arrival_margin_minutes}
                    required
                  />
                </Field>
                <Field label="Klant mag verzetten tot zoveel uur voor de afspraak">
                  <input
                    className={inputClass}
                    type="number"
                    name="reschedule_hours"
                    min="1"
                    max="168"
                    defaultValue={s.reschedule_hours}
                    required
                  />
                </Field>
              </div>
            </Card>
            <Card
              title="Factuurgegevens"
              description="Bestaande prijzen worden als inclusief btw behandeld. Een uitgegeven factuur blijft ongewijzigd; controleer deze gegevens zorgvuldig."
            >
              <div className="space-y-4">
                {[
                  ["legal_name", "Volledige bedrijfsnaam"],
                  ["business_address", "Volledig bedrijfsadres"],
                  ["kvk_number", "KvK-nummer"],
                  ["vat_number", "Btw-identificatienummer"],
                ].map(([name, label]) => (
                  <Field key={name} label={label}>
                    <input
                      className={inputClass}
                      name={name}
                      defaultValue={s[name]}
                      maxLength={name === "business_address" ? 400 : 150}
                    />
                  </Field>
                ))}
                <Field
                  label="Btw-percentage"
                  hint="Kies zelf de juiste regeling. Leeg laten blokkeert het uitgeven van facturen."
                >
                  <input
                    className={inputClass}
                    name="vat_percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    defaultValue={s.vat_percent ?? ""}
                  />
                </Field>
                <Field
                  label="Btw-toelichting"
                  hint="Verplicht bij 0%, bijvoorbeeld de toepasselijke vrijstelling."
                >
                  <textarea
                    className={inputClass}
                    name="tax_note"
                    defaultValue={s.tax_note}
                    maxLength={500}
                  />
                </Field>
              </div>
            </Card>
            <Card
              title="Echte klantreviews"
              description="Plak de openbare https-link naar je Google-bedrijfsprofiel of reviewpagina. Er worden geen beoordelingen of sterren verzonnen."
            >
              <Field label="Reviewlink">
                <input
                  className={inputClass}
                  type="url"
                  name="review_url"
                  defaultValue={s.review_url}
                  placeholder="https://..."
                  maxLength={1500}
                />
              </Field>
            </Card>
          </div>
        </ActionForm>
      )}
    </div>
  );
}
