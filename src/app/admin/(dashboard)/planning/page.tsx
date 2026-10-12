import { ActionForm } from "@/components/admin/action-form";
import { Card, Checkbox, Field, inputClass } from "@/components/admin/fields";
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

function WeekdaySelect({ defaultValue = 1 }: { defaultValue?: number }) {
  return (
    <select name="weekday" defaultValue={defaultValue} className={inputClass}>
      {WEEK_ORDER.map((day) => (
        <option key={day} value={day}>
          {WEEKDAYS[day]}
        </option>
      ))}
    </select>
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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">Planning</h1>
        <p className="mt-1 text-sm text-navy-600">
          Wanneer je werkt en wanneer klanten kunnen boeken. Alle tijden zijn Nederlandse tijd.
        </p>
      </header>

      <Card title="Openingstijden" description="Meerdere blokken per dag kan, bijvoorbeeld voor een lunchpauze.">
        <ul className="space-y-4">
          {(workHours ?? []).map((slot) => (
            <li key={slot.id} className="rounded-xl border border-navy-100 p-4">
              <ActionForm action={updateWorkHour.bind(null, slot.id)}>
                <div className="grid gap-4 md:grid-cols-[1fr_8rem_8rem_auto] md:items-end">
                  <Field label="Dag">
                    <WeekdaySelect defaultValue={slot.weekday} />
                  </Field>
                  <Field label="Open">
                    <input name="opens_at" type="time" defaultValue={slot.opens_at.slice(0, 5)} required className={inputClass} />
                  </Field>
                  <Field label="Dicht">
                    <input name="closes_at" type="time" defaultValue={slot.closes_at.slice(0, 5)} required className={inputClass} />
                  </Field>
                  <Checkbox name="active" label="Actief" defaultChecked={slot.active} />
                </div>
              </ActionForm>
              <form action={deleteWorkHour.bind(null, slot.id)} className="mt-3">
                <button type="submit" className="text-sm text-red-700 hover:underline">
                  Verwijderen
                </button>
              </form>
            </li>
          ))}
        </ul>

        <div className="mt-6 border-t border-navy-100 pt-6">
          <h3 className="text-sm font-semibold text-navy-900">Nieuw openingsblok</h3>
          <ActionForm action={addWorkHour} submitLabel="Toevoegen">
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <Field label="Dag">
                <WeekdaySelect />
              </Field>
              <Field label="Open">
                <input name="opens_at" type="time" defaultValue="09:00" required className={inputClass} />
              </Field>
              <Field label="Dicht">
                <input name="closes_at" type="time" defaultValue="18:00" required className={inputClass} />
              </Field>
            </div>
          </ActionForm>
        </div>
      </Card>

      <Card title="Boekingsregels" description="Hoe lang een tijdslot is, komt uit de reparatie zelf. Hier stel je de rest in.">
        <ActionForm action={saveSlotSettings}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Startinterval (minuten)" hint="Klanten kiezen een starttijd op dit raster, bijvoorbeeld elke 30 minuten.">
              <input name="slot_step_minutes" type="number" min={5} max={120} defaultValue={settings?.slot_step_minutes ?? 30} required className={inputClass} />
            </Field>
            <Field label="Minimaal vooruit boeken (uren)" hint="Hoeveel uur van tevoren een klant nog kan boeken.">
              <input name="booking_lead_hours" type="number" min={0} defaultValue={settings?.booking_lead_hours ?? 24} required className={inputClass} />
            </Field>
            <Field label="Maximaal afspraken per dag">
              <input name="max_appointments_per_day" type="number" min={1} max={50} defaultValue={settings?.max_appointments_per_day ?? 6} required className={inputClass} />
            </Field>
            <Field label="Reistijd tussen afspraken (minuten)" hint="Tijd die je nodig hebt om naar de volgende klant te rijden.">
              <input name="travel_buffer_minutes" type="number" min={0} max={240} defaultValue={settings?.travel_buffer_minutes ?? 0} required className={inputClass} />
            </Field>
          </div>
        </ActionForm>
      </Card>

      <Card title="Vrije dagen en blokkades" description="Momenten waarop je niet kunt. Die worden niet aangeboden aan klanten.">
        {(blocked ?? []).length === 0 ? (
          <p className="text-sm text-navy-600">Geen komende blokkades.</p>
        ) : (
          <ul className="divide-y divide-navy-100">
            {(blocked ?? []).map((period) => (
              <li key={period.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-navy-950">
                    {formatShopDateTime(period.starts_at)} – {formatShopDateTime(period.ends_at)}
                  </p>
                  {period.reason && <p className="text-sm text-navy-600">{period.reason}</p>}
                </div>
                <form action={deleteBlockedPeriod.bind(null, period.id)}>
                  <button type="submit" className="text-sm text-red-700 hover:underline">
                    Verwijderen
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 border-t border-navy-100 pt-6">
          <h3 className="text-sm font-semibold text-navy-900">Nieuwe blokkade</h3>
          <ActionForm action={addBlockedPeriod} submitLabel="Blokkade toevoegen">
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <Field label="Van">
                <input name="starts_at" type="datetime-local" required className={inputClass} />
              </Field>
              <Field label="Tot">
                <input name="ends_at" type="datetime-local" required className={inputClass} />
              </Field>
              <Field label="Reden (optioneel)" className="md:col-span-2">
                <input name="reason" placeholder="Bijvoorbeeld vakantie of feestdag" className={inputClass} />
              </Field>
            </div>
          </ActionForm>
        </div>
      </Card>
    </div>
  );
}
