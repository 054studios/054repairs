import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/page-header";
import { Card, Field, Select, inputClass } from "@/components/admin/fields";
import { ActionForm } from "@/components/admin/action-form";
import { OperationsNotice } from "@/components/admin/operations-notice";
import { saveStock } from "../bedrijfsvoering/actions";
export const metadata = { title: "Onderdelenvoorraad | 054repairs admin" };
export default async function Page() {
  const { supabase } = await requireAdmin();
  const [stock, prices, models, types, qualities] = await Promise.all([
    supabase.from("stock_items").select("*").order("id"),
    supabase
      .from("repair_prices")
      .select("id,model_id,repair_type_id,quality_id")
      .order("model_id"),
    supabase.from("device_models").select("id,name"),
    supabase.from("repair_types").select("id,name"),
    supabase.from("repair_qualities").select("id,name"),
  ]);
  if (stock.error)
    return (
      <div>
        <PageHeader title="Onderdelenvoorraad" />
        <OperationsNotice />
      </div>
    );
  const name = (rows: { id: string; name: string }[] | null, id: string) =>
    rows?.find((r) => r.id === id)?.name ?? "Onbekend";
  const label = (r: {
    model_id: string;
    repair_type_id: string;
    quality_id: string;
  }) =>
    [
      name(models.data, r.model_id),
      name(types.data, r.repair_type_id),
      name(qualities.data, r.quality_id),
    ].join(" · ");
  return (
    <div>
      <PageHeader
        title="Onderdelenvoorraad"
        description="Reserveringen bij boeken, vrijgave bij annuleren of verlopen en verbruik bij Klaar. Alleen toegevoegde combinaties worden bewaakt."
      />
      <div className="space-y-5">
        <Card
          title="Voorraad instellen"
          description="Vul de fysieke voorraad inclusief gereserveerde onderdelen in. Controleer bij de eerste inrichting ook bestaande afspraken."
        >
          <ActionForm action={saveStock}>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Model, reparatie en kwaliteit">
                <Select name="price_id" required>
                  <option value="">Kies een combinatie</option>
                  {prices.data?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {label(p)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Fysiek aanwezig">
                <input
                  className={inputClass}
                  type="number"
                  name="on_hand"
                  min="0"
                  max="100000"
                  required
                />
              </Field>
              <Field label="Waarschuwen vanaf">
                <input
                  className={inputClass}
                  type="number"
                  name="minimum"
                  min="0"
                  max="100000"
                  defaultValue={2}
                  required
                />
              </Field>
            </div>
          </ActionForm>
        </Card>
        {stock.data?.length === 0 ? (
          <Card title="Nog geen voorraadregels">
            <p>Voeg de onderdelen toe die je automatisch wilt laten bewaken.</p>
          </Card>
        ) : (
          stock.data?.map((s) => {
            const price = prices.data?.find(
              (p) =>
                p.model_id === s.model_id &&
                p.repair_type_id === s.repair_type_id &&
                p.quality_id === s.quality_id,
            );
            const free = s.on_hand - s.reserved;
            return (
              <Card
                key={s.id}
                title={label(s)}
                description={
                  s.reserved +
                  " gereserveerd · " +
                  free +
                  " vrij" +
                  (free <= s.minimum ? " · Bijbestellen" : "")
                }
              >
                {price && (
                  <ActionForm action={saveStock} layout="inline">
                    <input type="hidden" name="price_id" value={price.id} />
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Fysiek aanwezig">
                        <input
                          className={inputClass}
                          type="number"
                          name="on_hand"
                          min={s.reserved}
                          max="100000"
                          defaultValue={s.on_hand}
                          required
                        />
                      </Field>
                      <Field label="Waarschuwen vanaf">
                        <input
                          className={inputClass}
                          type="number"
                          name="minimum"
                          min="0"
                          max="100000"
                          defaultValue={s.minimum}
                          required
                        />
                      </Field>
                    </div>
                  </ActionForm>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
