import Link from "next/link";
import { ActionForm } from "@/components/admin/action-form";
import { Card, Checkbox, Field, inputClass } from "@/components/admin/fields";
import { requireAdmin } from "@/lib/auth";
import { centsToEuroInput } from "@/lib/money";
import {
  createModel,
  createQuality,
  createRepairType,
  savePrices,
  updateModel,
  updateQuality,
  updateRepairType,
} from "./actions";

export const metadata = {
  title: "Catalogus | 054repairs admin",
  robots: { index: false, follow: false },
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ model?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { model: modelParam } = await searchParams;

  const [{ data: brands }, { data: models }, { data: repairTypes }, { data: qualities }] =
    await Promise.all([
      supabase.from("brands").select("id, name").order("sort_order"),
      supabase.from("device_models").select("id, name, active, sort_order, brand_id").order("sort_order"),
      supabase.from("repair_types").select("id, name, description, duration_minutes, active, sort_order").order("sort_order"),
      supabase.from("repair_qualities").select("id, name, description, active, sort_order").order("sort_order"),
    ]);

  const selectedModel = models?.find((model) => model.id === modelParam) ?? models?.[0];

  const { data: prices } = selectedModel
    ? await supabase.from("repair_prices").select("repair_type_id, quality_id, price_cents").eq("model_id", selectedModel.id)
    : { data: [] };

  const priceByKey = new Map((prices ?? []).map((p) => [`${p.repair_type_id}:${p.quality_id}`, p.price_cents]));
  const defaultBrandId = brands?.[0]?.id ?? "";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">Catalogus</h1>
        <p className="mt-1 text-sm text-navy-600">
          Modellen, reparaties, kwaliteiten en prijzen. Wat je hier aanpast, zien klanten direct.
        </p>
      </header>

      <Card title="Modellen" description="Alleen actieve modellen kunnen klanten kiezen.">
        <ul className="space-y-4">
          {(models ?? []).map((model) => (
            <li key={model.id} className="rounded-xl border border-navy-100 p-4">
              <ActionForm action={updateModel.bind(null, model.id)}>
                <div className="grid gap-4 md:grid-cols-[1fr_8rem_auto] md:items-end">
                  <Field label="Naam">
                    <input name="name" defaultValue={model.name} required className={inputClass} />
                  </Field>
                  <Field label="Volgorde">
                    <input name="sort_order" type="number" min={0} defaultValue={model.sort_order} className={inputClass} />
                  </Field>
                  <Checkbox name="active" label="Actief" defaultChecked={model.active} />
                </div>
              </ActionForm>
            </li>
          ))}
        </ul>

        <div className="mt-6 border-t border-navy-100 pt-6">
          <h3 className="text-sm font-semibold text-navy-900">Nieuw model</h3>
          <ActionForm action={createModel} submitLabel="Model toevoegen">
            <input type="hidden" name="brand_id" value={defaultBrandId} />
            <div className="mt-3 grid gap-4 md:grid-cols-[1fr_8rem]">
              <Field label="Naam" hint="Bijvoorbeeld iPhone 17 Pro">
                <input name="name" required className={inputClass} />
              </Field>
              <Field label="Volgorde">
                <input name="sort_order" type="number" min={0} defaultValue={(models?.length ?? 0) + 1} className={inputClass} />
              </Field>
            </div>
          </ActionForm>
        </div>
      </Card>

      <Card title="Reparaties" description="De duur bepaalt hoe lang een tijdslot is. Na de duur krijgt de klant het toestel terug.">
        <ul className="space-y-4">
          {(repairTypes ?? []).map((repair) => (
            <li key={repair.id} className="rounded-xl border border-navy-100 p-4">
              <ActionForm action={updateRepairType.bind(null, repair.id)}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Naam">
                    <input name="name" defaultValue={repair.name} required className={inputClass} />
                  </Field>
                  <Field label="Omschrijving">
                    <input name="description" defaultValue={repair.description ?? ""} className={inputClass} />
                  </Field>
                  <Field label="Duur in minuten">
                    <input name="duration_minutes" type="number" min={5} step={5} defaultValue={repair.duration_minutes} required className={inputClass} />
                  </Field>
                  <Field label="Volgorde">
                    <input name="sort_order" type="number" min={0} defaultValue={repair.sort_order} className={inputClass} />
                  </Field>
                </div>
                <div className="mt-4">
                  <Checkbox name="active" label="Actief" defaultChecked={repair.active} />
                </div>
              </ActionForm>
            </li>
          ))}
        </ul>

        <div className="mt-6 border-t border-navy-100 pt-6">
          <h3 className="text-sm font-semibold text-navy-900">Nieuwe reparatie</h3>
          <ActionForm action={createRepairType} submitLabel="Reparatie toevoegen">
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <Field label="Naam">
                <input name="name" required className={inputClass} />
              </Field>
              <Field label="Omschrijving">
                <input name="description" className={inputClass} />
              </Field>
              <Field label="Duur in minuten">
                <input name="duration_minutes" type="number" min={5} step={5} defaultValue={30} required className={inputClass} />
              </Field>
              <Field label="Volgorde">
                <input name="sort_order" type="number" min={0} defaultValue={(repairTypes?.length ?? 0) + 1} className={inputClass} />
              </Field>
            </div>
          </ActionForm>
        </div>
      </Card>

      <Card title="Kwaliteiten" description="Bijvoorbeeld Standaard en Premium. Klanten kiezen er één per reparatie.">
        <ul className="space-y-4">
          {(qualities ?? []).map((quality) => (
            <li key={quality.id} className="rounded-xl border border-navy-100 p-4">
              <ActionForm action={updateQuality.bind(null, quality.id)}>
                <div className="grid gap-4 md:grid-cols-[1fr_2fr_8rem_auto] md:items-end">
                  <Field label="Naam">
                    <input name="name" defaultValue={quality.name} required className={inputClass} />
                  </Field>
                  <Field label="Omschrijving">
                    <input name="description" defaultValue={quality.description ?? ""} className={inputClass} />
                  </Field>
                  <Field label="Volgorde">
                    <input name="sort_order" type="number" min={0} defaultValue={quality.sort_order} className={inputClass} />
                  </Field>
                  <Checkbox name="active" label="Actief" defaultChecked={quality.active} />
                </div>
              </ActionForm>
            </li>
          ))}
        </ul>

        <div className="mt-6 border-t border-navy-100 pt-6">
          <h3 className="text-sm font-semibold text-navy-900">Nieuwe kwaliteit</h3>
          <ActionForm action={createQuality} submitLabel="Kwaliteit toevoegen">
            <div className="mt-3 grid gap-4 md:grid-cols-[1fr_2fr_8rem]">
              <Field label="Naam">
                <input name="name" required className={inputClass} />
              </Field>
              <Field label="Omschrijving">
                <input name="description" className={inputClass} />
              </Field>
              <Field label="Volgorde">
                <input name="sort_order" type="number" min={0} defaultValue={(qualities?.length ?? 0) + 1} className={inputClass} />
              </Field>
            </div>
          </ActionForm>
        </div>
      </Card>

      <Card title="Prijzen per model" description="Laat een veld leeg als die reparatie voor dit model niet wordt aangeboden.">
        {!selectedModel ? (
          <p className="text-sm text-navy-600">Voeg eerst een model toe.</p>
        ) : (
          <>
            <nav className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1">
              {(models ?? []).map((model) => (
                <Link
                  key={model.id}
                  href={`/admin/catalogus?model=${model.id}`}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    model.id === selectedModel.id
                      ? "bg-navy-900 text-white"
                      : "bg-navy-50 text-navy-700 hover:bg-navy-100"
                  }`}
                >
                  {model.name}
                </Link>
              ))}
            </nav>

            <ActionForm action={savePrices.bind(null, selectedModel.id)}>
              <div className="-mx-2 overflow-x-auto px-2">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-navy-100 text-navy-600">
                      <th className="py-2 pr-4 font-medium">Reparatie</th>
                      {(qualities ?? []).map((quality) => (
                        <th key={quality.id} className="py-2 pr-4 font-medium">
                          {quality.name} (€)
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(repairTypes ?? []).map((repair) => (
                      <tr key={repair.id} className="border-b border-navy-50">
                        <td className="py-3 pr-4 font-medium text-navy-900">{repair.name}</td>
                        {(qualities ?? []).map((quality) => {
                          const key = `${repair.id}:${quality.id}`;
                          return (
                            <td key={quality.id} className="py-3 pr-4">
                              <input
                                name={`price:${key}`}
                                inputMode="decimal"
                                placeholder="—"
                                defaultValue={centsToEuroInput(priceByKey.get(key))}
                                className={`${inputClass} w-28`}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ActionForm>
          </>
        )}
      </Card>
    </div>
  );
}
