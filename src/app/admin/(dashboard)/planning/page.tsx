import { CalendarBlankIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { ActionForm } from "@/components/admin/action-form";
import { AffixInput, Card, CardSection, Checkbox, Field, inputClass, RowHeader, Select } from "@/components/admin/fields";
import { PageHeader } from "@/components/admin/page-header";
import { SubmitButton } from "@/components/admin/submit-button";
import { buttonClass } from "@/components/ui/styles";
import { requireAdmin } from "@/lib/auth";
import { formatShopDateTime, WEEKDAYS } from "@/lib/time";
import {
  addBlockedPeriod,
  addWorkHour,
  deleteBlockedPeriod,
  deleteWorkHour,
  saveSlotSettings,
  updateWorkHour,
} from "./actions";

export const metadata = {
  title: "Planning | 054repairs admin",
  robots: { index: false, follow: false },
};

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first

// Day, open, close, active. Fixed widths, so every weekday row lines up under the header.
// On a phone: day and active on one line, open and close on the next.
const HOUR_COLUMNS = "lg:grid-cols-[10rem_8rem_8rem_6rem]";

// Delete buttons: labelled on a phone, icon only in the dense desktop row.
const deleteButtonClass = `${buttonClass("danger")} lg:w-12 lg:px-0`;

function WeekdaySelect({ defaultValue = 1 }: { defaultValue?: number }) {
  return (
    <Select name="weekday" defaultValue={defaultValue}>
      {WEEK_ORDER.map((day) => (
        <option key={day} value={day}>
          {WEEKDAYS[day]}
        </option>
      ))}
    </Select>
  );
}

export default async function PlanningPage() {
  const { supabase } = await requireAdmin();
  const nowIso = new Date().toISOString();

  const [{ data: settings }, { data: workHours }, { data: blocked }] = await Promise.all([
    supabase
      .from("settings")
      .select("slot_step_minutes, booking_lead_hours, max_appointments_per_day, travel_buffer_minutes")
      .eq("id", 1)
      .single(),
    supabase.from("work_hours").select("id, weekday, opens_at, closes_at, active").order("weekday").order("opens_at"),
    supabase
      .from("blocked_periods")
      .select("id, starts_at, ends_at, reason")
      .gte("ends_at", nowIso)
      .order("starts_at"),
  ]);

  // Show the week the way people read it: Monday first, Sunday last.
  const hours = [...(workHours ?? [])].sort(
    (a, b) => WEEK_ORDER.indexOf(a.weekday) - WEEK_ORDER.indexOf(b.weekday) || a.opens_at.localeCompare(b.opens_at),
  );
  const periods = blocked ?? [];

  return (
    <div>
      <PageHeader
        title="Planning"
        description="Wanneer je werkt en wanneer klanten kunnen boeken. Alle tijden zijn Nederlandse tijd."
      />

      <div className="space-y-4 lg:space-y-6">
        <Card title="Openingstijden" description="Meerdere blokken per dag kan, bijvoorbeeld voor een lunchpauze.">
          {hours.length === 0 ? (
            <p className="text-[0.95rem] text-steel-400">Nog geen openingstijden. Voeg hieronder een blok toe.</p>
          ) : (
            <>
              <RowHeader
                columns={HOUR_COLUMNS}
                labels={["Dag", "Open", "Dicht", "Actief"]}
                buttons={[
                  { label: "Opslaan", className: buttonClass("secondary") },
                  { label: "Verwijder", className: deleteButtonClass },
                ]}
              />
              <ul className="divide-y divide-line">
                {hours.map((slot) => (
                  <li key={slot.id} className="flex flex-wrap items-start gap-3 py-3">
                    <ActionForm
                      action={updateWorkHour.bind(null, slot.id)}
                      layout="inline"
                      variant="secondary"
                      className="min-w-0 flex-[1_1_18rem]"
                    >
                      <div className={`grid grid-cols-2 items-end gap-3 ${HOUR_COLUMNS}`}>
                        <Field label="Dag" compactLabel>
                          <WeekdaySelect defaultValue={slot.weekday} />
                        </Field>
                        <Checkbox name="active" label="Actief" defaultChecked={slot.active} compactLabel />
                        <Field label="Open" compactLabel className="lg:col-start-2 lg:row-start-1">
                          <input
                            name="opens_at"
                            type="time"
                            defaultValue={slot.opens_at.slice(0, 5)}
                            required
                            className={`${inputClass} figures`}
                          />
                        </Field>
                        <Field label="Dicht" compactLabel className="lg:col-start-3 lg:row-start-1">
                          <input
                            name="closes_at"
                            type="time"
                            defaultValue={slot.closes_at.slice(0, 5)}
                            required
                            className={`${inputClass} figures`}
                          />
                        </Field>
                      </div>
                    </ActionForm>
                    <form action={deleteWorkHour.bind(null, slot.id)}>
                      <SubmitButton
                        className={deleteButtonClass}
                        icon={<TrashIcon aria-hidden="true" className="size-5" />}
                        label={`Verwijder ${WEEKDAYS[slot.weekday]} ${slot.opens_at.slice(0, 5)} tot ${slot.closes_at.slice(0, 5)}`}
                      >
                        <span className="lg:sr-only">Verwijder</span>
                      </SubmitButton>
                    </form>
                  </li>
                ))}
              </ul>
            </>
          )}

          <CardSection title="Nieuw openingsblok">
            <ActionForm action={addWorkHour} submitLabel="Blok toevoegen" variant="secondary">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_9rem_9rem]">
                <Field label="Dag" className="col-span-2 sm:col-span-1">
                  <WeekdaySelect />
                </Field>
                <Field label="Open">
                  <input name="opens_at" type="time" defaultValue="09:00" required className={`${inputClass} figures`} />
                </Field>
                <Field label="Dicht">
                  <input name="closes_at" type="time" defaultValue="18:00" required className={`${inputClass} figures`} />
                </Field>
              </div>
            </ActionForm>
          </CardSection>
        </Card>

        <Card title="Boekingsregels" description="Hoe lang een tijdslot is, komt uit de reparatie zelf. Hier stel je de rest in.">
          <ActionForm action={saveSlotSettings} submitLabel="Regels opslaan">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Startinterval" hint="Klanten kiezen een starttijd op dit raster, bijvoorbeeld elke 30 minuten.">
                <AffixInput
                  name="slot_step_minutes"
                  type="number"
                  min={5}
                  max={120}
                  suffix="min"
                  defaultValue={settings?.slot_step_minutes ?? 30}
                  required
                />
              </Field>
              <Field label="Minimaal vooruit boeken" hint="Hoeveel uur van tevoren een klant nog kan boeken.">
                <AffixInput
                  name="booking_lead_hours"
                  type="number"
                  min={0}
                  suffix="uur"
                  defaultValue={settings?.booking_lead_hours ?? 24}
                  required
                />
              </Field>
              <Field label="Maximaal afspraken per dag">
                <input
                  name="max_appointments_per_day"
                  type="number"
                  min={1}
                  max={50}
                  defaultValue={settings?.max_appointments_per_day ?? 6}
                  required
                  className={`${inputClass} figures`}
                />
              </Field>
              <Field label="Reistijd tussen afspraken" hint="Tijd die je nodig hebt om naar de volgende klant te rijden.">
                <AffixInput
                  name="travel_buffer_minutes"
                  type="number"
                  min={0}
                  max={240}
                  suffix="min"
                  defaultValue={settings?.travel_buffer_minutes ?? 0}
                  required
                />
              </Field>
            </div>
          </ActionForm>
        </Card>

        <Card title="Vrije dagen en blokkades" description="Momenten waarop je niet kunt. Die worden niet aangeboden aan klanten.">
          {periods.length === 0 ? (
            <div className="flex items-start gap-3">
              <CalendarBlankIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-steel-500" />
              <p className="text-[0.95rem] text-steel-400">Geen komende blokkades.</p>
            </div>
          ) : (
            <ul className="-my-3 divide-y divide-line">
              {periods.map((period) => (
                <li key={period.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="figures font-medium text-steel-50">
                      {formatShopDateTime(period.starts_at)} tot {formatShopDateTime(period.ends_at)}
                    </p>
                    {period.reason && <p className="text-sm text-steel-400">{period.reason}</p>}
                  </div>
                  <form action={deleteBlockedPeriod.bind(null, period.id)}>
                    <SubmitButton
                      className={buttonClass("danger")}
                      icon={<TrashIcon aria-hidden="true" className="size-5" />}
                      label={`Verwijder blokkade van ${formatShopDateTime(period.starts_at)}`}
                    >
                      Verwijder
                    </SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <CardSection title="Nieuwe blokkade">
            <ActionForm action={addBlockedPeriod} submitLabel="Blokkade toevoegen" variant="secondary">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Van">
                  <input name="starts_at" type="datetime-local" required className={`${inputClass} figures`} />
                </Field>
                <Field label="Tot">
                  <input name="ends_at" type="datetime-local" required className={`${inputClass} figures`} />
                </Field>
                <Field label="Reden (optioneel)" className="sm:col-span-2">
                  <input name="reason" placeholder="Bijvoorbeeld vakantie of feestdag" className={inputClass} />
                </Field>
              </div>
            </ActionForm>
          </CardSection>
        </Card>
      </div>
    </div>
  );
}
