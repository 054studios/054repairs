import { ClockIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { addMinutesIso, formatClock, formatDayLong, formatDuration } from "@/lib/booking/format";
import { buttonClass, choiceClass, insetClass, skeletonClass, stepPanelClass } from "@/lib/booking/styles";
import type { DayAvailability, PublicSettings } from "@/lib/booking/types";
import { WEEKDAYS } from "@/lib/time";
import { StepHeading } from "./step-heading";

const monthShort = new Intl.DateTimeFormat("nl-NL", { month: "short", timeZone: "UTC" });

function dayParts(dayIso: string) {
  const [year, month, day] = dayIso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return {
    weekday: WEEKDAYS[date.getUTCDay()].slice(0, 2),
    day,
    month: monthShort.format(date).replace(".", ""),
  };
}

function lowerFirst(text: string) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

const STRIP_KEYS = ["ArrowRight", "ArrowLeft", "Home", "End"];

export function StepTime({
  settings,
  durationMinutes,
  days,
  day,
  slots,
  slotsLoaded,
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
  slotsLoaded: boolean;
  startsAt: string | null;
  busy: boolean;
  onPickDay: (day: string) => void;
  onPickTime: (startsAt: string) => void;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [focusDate, setFocusDate] = useState<string | null>(null);

  // Coming back to this step: bring the chosen day into view inside the strip, without moving the page.
  useEffect(() => {
    const strip = stripRef.current;
    const chosen = strip?.querySelector<HTMLElement>('[aria-pressed="true"]');

    if (strip && chosen) {
      strip.scrollLeft = chosen.offsetLeft - strip.offsetLeft - 16;
    }
  }, []);

  const openDays = days.filter((item) => item.open);
  const hasOpenDays = openDays.length > 0;
  // Roving tab stop: one day in the tab order, arrow keys move between open days.
  const tabStop = focusDate ?? day ?? openDays[0]?.date ?? null;

  function handleStripKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!STRIP_KEYS.includes(event.key)) {
      return;
    }

    const current = openDays.findIndex((item) => item.date === tabStop);

    if (current < 0) {
      return;
    }

    event.preventDefault();

    const last = openDays.length - 1;
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? last
          : Math.min(last, Math.max(0, current + (event.key === "ArrowRight" ? 1 : -1)));
    const date = openDays[next].date;

    setFocusDate(date);
    stripRef.current?.querySelector<HTMLButtonElement>(`[data-date="${date}"]`)?.focus();
  }

  const loadingSlots = day !== null && !slotsLoaded && busy;
  const slotsFailed = day !== null && !slotsLoaded && !busy;

  return (
    <>
      <StepHeading
        title="Wanneer komen we langs?"
        text="Kies een dag en daarna een begintijd. Alle tijden zijn Nederlandse tijd."
      />

      <div className={stepPanelClass}>
        <div className={`${insetClass} flex items-start gap-3 p-4`}>
          <ClockIcon size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-cyan-400" />
          <p className="text-[0.9375rem] leading-relaxed text-steel-300">
            <span className="font-semibold text-steel-50">
              Je tijdslot duurt <span className="figures">{formatDuration(durationMinutes)}</span>.
            </span>{" "}
            Dat is de reparatietijd. Zodra die voorbij is, heb je je toestel terug.
          </p>
        </div>

        {!hasOpenDays ? (
          <div className="mt-5" role="status">
            <p className="font-medium text-steel-100">
              In de komende <span className="figures">{days.length}</span> dagen is er geen tijd vrij voor deze reparatie.
            </p>
            <p className="mt-1 text-[0.9375rem] text-steel-400">
              {settings.phone
                ? `Bel ons op ${settings.phone}, dan zoeken wij samen een moment.`
                : "Kies minder reparaties voor een korter tijdslot, of probeer het later opnieuw."}
            </p>
          </div>
        ) : (
          <section aria-labelledby="days-title" className="mt-6">
            <h2 id="days-title" className="font-display text-lg font-semibold tracking-[-0.02em] text-steel-50">
              Kies een dag
            </h2>
            <div
              ref={stripRef}
              role="toolbar"
              aria-labelledby="days-title"
              aria-orientation="horizontal"
              onKeyDown={handleStripKey}
              className="-mx-4 mt-3 flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto overscroll-x-contain px-4 pb-3 sm:-mx-6 sm:scroll-px-6 sm:px-6"
            >
              {days.map((item) => {
                const parts = dayParts(item.date);
                const selected = item.date === day;

                return (
                  <button
                    key={item.date}
                    data-date={item.date}
                    type="button"
                    disabled={!item.open}
                    tabIndex={item.date === tabStop ? 0 : -1}
                    aria-pressed={selected}
                    aria-label={`${formatDayLong(item.date)}${item.open ? "" : ", geen tijd vrij"}`}
                    onClick={() => {
                      setFocusDate(item.date);
                      onPickDay(item.date);
                    }}
                    className={`flex w-[4.25rem] shrink-0 snap-start flex-col items-center gap-1 py-2.5 ${
                      item.open
                        ? choiceClass(selected)
                        : "cursor-not-allowed select-none rounded-ui border border-dashed border-line-strong text-steel-500"
                    }`}
                  >
                    <span className="text-xs font-medium">{parts.weekday}</span>
                    <span
                      className={`figures font-display text-xl font-semibold leading-none ${item.open ? "" : "line-through decoration-1"}`}
                    >
                      {parts.day}
                    </span>
                    <span className={`text-xs ${selected ? "text-cyan-300" : item.open ? "text-steel-400" : ""}`}>
                      {parts.month}
                    </span>
                  </button>
                );
              })}
              <span aria-hidden="true" className="w-px shrink-0" />
            </div>
          </section>
        )}

        {day && (
          <section aria-labelledby="slots-title" className="mt-5 border-t border-line pt-5">
            <h2 id="slots-title" className="font-display text-lg font-semibold tracking-[-0.02em] text-steel-50">
              Tijden op {lowerFirst(formatDayLong(day))}
            </h2>

            <div aria-live="polite">
              {loadingSlots ? (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4" aria-busy="true">
                  <span className="sr-only">Tijden laden</span>
                  {Array.from({ length: 8 }, (_, index) => (
                    <div key={index} className={`${skeletonClass} h-14`} />
                  ))}
                </div>
              ) : slotsFailed ? (
                <div className="mt-3">
                  <p className="text-[0.9375rem] text-steel-300">De tijden voor deze dag zijn niet geladen.</p>
                  <button
                    type="button"
                    onClick={() => onPickDay(day)}
                    className={`${buttonClass("secondary", "md")} mt-3`}
                  >
                    Laad de tijden opnieuw
                  </button>
                </div>
              ) : slots.length === 0 ? (
                <p className="mt-3 text-[0.9375rem] text-steel-300">
                  Op deze dag is geen tijd meer vrij. Kies een andere dag.
                </p>
              ) : (
                <div role="group" aria-label="Begintijd" className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((iso) => {
                    const selected = startsAt === iso;

                    return (
                      <button
                        key={iso}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => onPickTime(iso)}
                        className={`flex min-h-14 flex-col items-center justify-center px-2 py-2 ${choiceClass(selected)}`}
                      >
                        <span className="figures text-base font-semibold">{formatClock(iso)}</span>
                        <span className={`figures text-xs ${selected ? "text-cyan-300" : "text-steel-400"}`}>
                          tot {formatClock(addMinutesIso(iso, durationMinutes))}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
