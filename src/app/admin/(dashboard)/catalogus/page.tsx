import Link from "next/link";
import { ActionForm } from "@/components/admin/action-form";
import { AffixInput, Card, CardSection, Checkbox, Field, inputClass, RowHeader } from "@/components/admin/fields";
import { PageHeader } from "@/components/admin/page-header";
import { ScrollStrip } from "@/components/admin/scroll-strip";
import { chipClass } from "@/components/ui/styles";
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

// Row forms share one column grid, so the fields line up like a table on large screens.
const MODEL_COLUMNS = "lg:grid-cols-[minmax(0,1fr)_7rem_6.5rem]";
const QUALITY_COLUMNS = "lg:grid-cols-[11rem_minmax(0,1fr)_7rem_6.5rem]";

// Compact price cell: still 44px high and 16px text, with the euro sign drawn inside.
const priceInputClass =
  "figures h-11 w-full rounded-ui bg-ink-850 pl-6 pr-2.5 text-right text-base text-steel-50 ring-1 ring-line-strong outline-none " +
  "transition-[box-shadow,background-color] duration-150 hover:ring-steel-500/40 focus:bg-ink-800 focus:ring-2 focus:ring-cyan-400";

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
    <div>
      <PageHeader
        title="Catalogus"
        description="Prijzen, modellen, reparaties en kwaliteiten. Wat je hier aanpast, zien klanten direct."
      />

      <div className="space-y-4 lg:space-y-6">
        {/* Prices first: they change most often. */}
        <Card title="Prijzen per model" description="Laat een veld leeg als die reparatie voor dit model niet wordt aangeboden.">
          {!selectedModel ? (
            <p className="text-[0.95rem] text-steel-400">Voeg eerst een model toe.</p>
          ) : (
            <>
              <ScrollStrip activeKey={selectedModel.id} className="-mx-4 mb-5 px-4 py-1 sm:-mx-6 sm:px-6">
                <nav
                  aria-label="Kies een model"
                  className="inline-flex gap-1 rounded-[14px] bg-ink-850 p-1 ring-1 ring-inset ring-line"
                >
                  {(models ?? []).map((model) => (
                    <Link
                      key={model.id}
                      href={`/admin/catalogus?model=${model.id}`}
                      scroll={false}
                      aria-current={model.id === selectedModel.id ? "page" : undefined}
                      className="inline-flex h-11 shrink-0 snap-start items-center whitespace-nowrap rounded-ui px-3.5 text-sm font-medium text-steel-400 transition-[background-color,color] duration-150 hover:text-steel-100 aria-[current=page]:bg-ink-700 aria-[current=page]:text-steel-50 aria-[current=page]:shadow-raised"
                    >
                      {model.name}
                    </Link>
                  ))}
                </nav>
              </ScrollStrip>

              <ActionForm action={savePrices.bind(null, selectedModel.id)} submitLabel="Prijzen opslaan">
                {/* Wide matrices scroll sideways; the repair names stay pinned on the left. */}
                <div className="-mx-4 overflow-x-auto sm:-mx-6">
                  <table className="w-full border-separate border-spacing-0 text-sm">
                    <caption className="sr-only">Prijzen voor {selectedModel.name} in euro</caption>
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          className="sticky left-0 z-10 border-r border-line bg-ink-900 py-2 pl-4 pr-2 text-left font-medium text-steel-400 sm:pl-6 sm:pr-3"
                        >
                          Reparatie
                        </th>
                        {(qualities ?? []).map((quality) => (
                          <th key={quality.id} scope="col" className="min-w-[6.75rem] px-1.5 py-2 text-right font-medium text-steel-400">
                            <span className="inline-flex items-center gap-2">
                              {quality.name}
                              {!quality.active && <span className={chipClass("neutral")}>Inactief</span>}
                            </span>
                          </th>
                        ))}
                        <th aria-hidden="true" className="w-2 sm:w-4" />
                      </tr>
                    </thead>
                    <tbody>
                      {(repairTypes ?? []).map((repair) => (
                        <tr key={repair.id}>
                          <th
                            scope="row"
                            className="sticky left-0 z-10 border-r border-t border-line bg-ink-900 py-1.5 pl-4 pr-2 text-left text-[0.8125rem] font-medium leading-snug text-steel-100 sm:pl-6 sm:pr-3 sm:text-sm"
                          >
                            <span className="block max-w-[6.5rem] sm:max-w-none">{repair.name}</span>
                            {!repair.active && <span className={`${chipClass("neutral")} mt-1`}>Inactief</span>}
                          </th>
                          {(qualities ?? []).map((quality) => {
                            const key = `${repair.id}:${quality.id}`;
                            return (
                              <td key={quality.id} className="border-t border-line px-1.5 py-1.5">
                                <span className="relative block">
                                  <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-steel-500"
                                  >
                                    €
                                  </span>
                                  <input
                                    name={`price:${key}`}
                                    inputMode="decimal"
                                    aria-label={`${repair.name}, ${quality.name}, prijs in euro`}
                                    defaultValue={centsToEuroInput(priceByKey.get(key))}
                                    className={priceInputClass}
                                  />
                                </span>
                              </td>
                            );
                          })}
                          <td aria-hidden="true" className="border-t border-line" />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ActionForm>
            </>
          )}
        </Card>

        <Card title="Modellen" description="Alleen actieve modellen kunnen klanten kiezen.">
          <RowHeader columns={MODEL_COLUMNS} labels={["Naam", "Volgorde", "Actief"]} />
          <ul className="divide-y divide-line">
            {(models ?? []).map((model) => (
              <li key={model.id} className="py-3">
                <ActionForm action={updateModel.bind(null, model.id)} layout="inline" variant="secondary">
                  <div className={`grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 ${MODEL_COLUMNS}`}>
                    <Field label="Naam" compactLabel className="col-span-2 lg:col-span-1">
                      <input name="name" defaultValue={model.name} required className={inputClass} />
                    </Field>
                    <Field label="Volgorde" compactLabel>
                      <input
                        name="sort_order"
                        type="number"
                        min={0}
                        defaultValue={model.sort_order}
                        className={`${inputClass} figures`}
                      />
                    </Field>
                    <Checkbox name="active" label="Actief" defaultChecked={model.active} compactLabel />
                  </div>
                </ActionForm>
              </li>
            ))}
          </ul>

          <CardSection title="Nieuw model">
            <ActionForm action={createModel} submitLabel="Model toevoegen" variant="secondary">
              <input type="hidden" name="brand_id" value={defaultBrandId} />
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
                <Field label="Naam" hint="Bijvoorbeeld iPhone 17 Pro">
                  <input name="name" required className={inputClass} />
                </Field>
                <Field label="Volgorde">
                  <input
                    name="sort_order"
                    type="number"
                    min={0}
                    defaultValue={(models?.length ?? 0) + 1}
                    className={`${inputClass} figures`}
                  />
                </Field>
              </div>
            </ActionForm>
          </CardSection>
        </Card>

        <Card
          title="Reparaties"
          description="De duur bepaalt hoe lang een tijdslot is. Na de duur krijgt de klant het toestel terug."
        >
          <ul className="divide-y divide-line">
            {(repairTypes ?? []).map((repair) => (
              <li key={repair.id} className="py-4">
                <ActionForm action={updateRepairType.bind(null, repair.id)} variant="secondary">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                    <Field label="Naam">
                      <input name="name" defaultValue={repair.name} required className={inputClass} />
                    </Field>
                    <Field label="Omschrijving">
                      <input name="description" defaultValue={repair.description ?? ""} className={inputClass} />
                    </Field>
                    <div className="grid grid-cols-2 items-end gap-3 sm:col-span-2 sm:grid-cols-[9rem_8rem_auto]">
                      <Field label="Duur">
                        <AffixInput
                          name="duration_minutes"
                          type="number"
                          min={5}
                          step={5}
                          suffix="min"
                          defaultValue={repair.duration_minutes}
                          required
                        />
                      </Field>
                      <Field label="Volgorde">
                        <input
                          name="sort_order"
                          type="number"
                          min={0}
                          defaultValue={repair.sort_order}
                          className={`${inputClass} figures`}
                        />
                      </Field>
                      <Checkbox name="active" label="Actief" defaultChecked={repair.active} />
                    </div>
                  </div>
                </ActionForm>
              </li>
            ))}
          </ul>

          <CardSection title="Nieuwe reparatie">
            <ActionForm action={createRepairType} submitLabel="Reparatie toevoegen" variant="secondary">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Naam">
                  <input name="name" required className={inputClass} />
                </Field>
                <Field label="Omschrijving">
                  <input name="description" className={inputClass} />
                </Field>
                <Field label="Duur">
                  <AffixInput
                    name="duration_minutes"
                    type="number"
                    min={5}
                    step={5}
                    suffix="min"
                    defaultValue={30}
                    required
                  />
                </Field>
                <Field label="Volgorde">
                  <input
                    name="sort_order"
                    type="number"
                    min={0}
                    defaultValue={(repairTypes?.length ?? 0) + 1}
                    className={`${inputClass} figures`}
                  />
                </Field>
              </div>
            </ActionForm>
          </CardSection>
        </Card>

        <Card title="Kwaliteiten" description="Bijvoorbeeld Standaard en Premium. Klanten kiezen er één per reparatie.">
          <RowHeader columns={QUALITY_COLUMNS} labels={["Naam", "Omschrijving", "Volgorde", "Actief"]} />
          <ul className="divide-y divide-line">
            {(qualities ?? []).map((quality) => (
              <li key={quality.id} className="py-3">
                <ActionForm action={updateQuality.bind(null, quality.id)} layout="inline" variant="secondary">
                  <div className={`grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 ${QUALITY_COLUMNS}`}>
                    <Field label="Naam" compactLabel className="col-span-2 lg:col-span-1">
                      <input name="name" defaultValue={quality.name} required className={inputClass} />
                    </Field>
                    <Field label="Omschrijving" compactLabel className="col-span-2 lg:col-span-1">
                      <input name="description" defaultValue={quality.description ?? ""} className={inputClass} />
                    </Field>
                    <Field label="Volgorde" compactLabel>
                      <input
                        name="sort_order"
                        type="number"
                        min={0}
                        defaultValue={quality.sort_order}
                        className={`${inputClass} figures`}
                      />
                    </Field>
                    <Checkbox name="active" label="Actief" defaultChecked={quality.active} compactLabel />
                  </div>
                </ActionForm>
              </li>
            ))}
          </ul>

          <CardSection title="Nieuwe kwaliteit">
            <ActionForm action={createQuality} submitLabel="Kwaliteit toevoegen" variant="secondary">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_8rem]">
                <Field label="Naam">
                  <input name="name" required className={inputClass} />
                </Field>
                <Field label="Omschrijving">
                  <input name="description" className={inputClass} />
                </Field>
                <Field label="Volgorde">
                  <input
                    name="sort_order"
                    type="number"
                    min={0}
                    defaultValue={(qualities?.length ?? 0) + 1}
                    className={`${inputClass} figures`}
                  />
                </Field>
              </div>
            </ActionForm>
          </CardSection>
        </Card>
      </div>
    </div>
  );
}
