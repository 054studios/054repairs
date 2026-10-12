import { formatClock, formatDayLong, formatDuration, monthTitle, weekdayIndexMonday } from "@/lib/booking/format";
import { cardClass } from "@/lib/booking/styles";
import type { DayAvailability, PublicSettings } from "@/lib/booking/types";
import { StepHeading } from "./step-heading";

type MonthGroup = { key: string; title: string; leading: number; days: DayAvailability[] };

const WEEKDAY_HEADERS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

function groupByMonth(days: DayAvailability[]): MonthGroup[] {
  const groups: MonthGroup[] = [];

  for (const day of days) {
    const key = day.date.slice(0, 7);
    const current = groups[groups.length - 1];

    if (!current || current.key !== key) {
      groups.push({ key, title: monthTitle(day.date), leading: weekdayIndexMonday(day.date), days: [day] });
    } else {
      current.days.push(day);
    }
  }

  return groups;
}

export function StepTime({
  settings,
  durationMinutes,
  days,
  day,
  slots,
  startsAt,
  busy,
  onPickDay,
  onPickTime,
}: {
  settings: PublicSettings;
  durationMinutes: number;
  days: DayAvailability[];
  day: string | null;
  slots: string[];
  startsAt: string | null;
  busy: boolean;
  onPickDay: (day: string) => void;
  onPickTime: (startsAt: string) => void;
}) {
  const months = groupByMonth(days);
  const hasOpenDays = days.some((item) => item.open);
  const firstDay = days[0]?.date;

  return (
    <>
      <StepHeading title="Wanneer komen we langs?" text="Kies eerst een dag en daarna een tijd." />

      <section className="rounded-2xl bg-navy-100/70 p-4 text-navy-900 ring-1 ring-navy-200">
        <p className="font-semibold">Je tijdslot duurt {formatDuration(durationMinutes)}</p>
        <p className="mt-1 text-sm text-navy-700">
          Dat is de reparatietijd. Je krijgt je toestel terug zodra die tijd voorbij is. Alle tijden zijn Nederlandse tijd.
        </p>
      </section>

      {!hasOpenDays ? (
        <section className={`${cardClass} mt-6`}>
          <p className="text-base text-navy-800">
            Er zijn in de komende dagen geen vrije tijden voor deze reparatie.
          </p>
          {settings.phone && <p className="mt-2 text-base text-navy-700">Bel ons op {settings.phone}.</p>}
        </section>
      ) : (
        <div className="mt-6 space-y-8">
          {months.map((month) => (
            <section key={month.key} aria-label={month.title}>
              <h2 className="text-base font-semibold text-navy-950">{month.title}</h2>

              <div className="mt-3 grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-navy-500">
                {WEEKDAY_HEADERS.map((header) => (
                  <span key={header}>{header}</span>
                ))}
              </div>

              <div className="mt-1.5 grid grid-cols-7 gap-1.5">
                {Array.from({ length: month.leading }, (_, index) => (
                  <span key={`lead-${index}`} aria-hidden="true" />
                ))}

                {month.days.map((item) => {
                  const selected = item.date === day;
                  const isToday = item.date === firstDay;

                  return (
                    <button
                      key={item.date}
                      type="button"
                      disabled={!item.open || busy}
                      aria-pressed={selected}
                      aria-label={`${formatDayLong(item.date)}${item.open ? "" : ", niet beschikbaar"}`}
                      onClick={() => onPickDay(item.date)}
                      className={`flex aspect-square items-center justify-center rounded-xl text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600 disabled:cursor-not-allowed ${
                        selected
                          ? "bg-navy-900 text-white"
                          : item.open
                            ? "bg-white text-navy-950 ring-1 ring-navy-200 hover:ring-navy-900"
                            : "bg-navy-50 text-navy-300 line-through"
                      } ${isToday && !selected ? "underline decoration-2 underline-offset-4" : ""}`}
                    >
                      {Number(item.date.slice(8))}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {day && (
        <section className="mt-8" aria-live="polite">
          <h2 className="text-base font-semibold text-navy-950">Tijden op {formatDayLong(day)}</h2>

          {busy && slots.length === 0 ? (
            <p className="mt-3 text-sm text-navy-600">Tijden laden…</p>
          ) : slots.length === 0 ? (
            <p className="mt-3 text-sm text-navy-600">Er zijn op deze dag geen vrije tijden meer. Kies een andere dag.</p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((iso) => {
                const selected = startsAt === iso;

                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={busy}
                    aria-pressed={selected}
                    onClick={() => onPickTime(iso)}
                    className={`rounded-xl px-3 py-3 text-base font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600 disabled:opacity-50 ${
                      selected
                        ? "bg-navy-900 text-white"
                        : "bg-white text-navy-950 ring-1 ring-navy-200 hover:ring-navy-900"
                    }`}
                  >
                    {formatClock(iso)}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}
    </>
  );
}
