"use client";

import { useId, useState, type CSSProperties } from "react";
import { formatEuro } from "@/lib/money";
import { kmLabel, travelFeeCents, type TravelRule } from "./facts";

// Drag to a distance and see the travel fee, calculated with the same formula as the booking.
// Values sit in fixed columns and lines, so nothing around them moves while dragging.
export function TravelFee({ rule, maxTravelKm }: { rule: TravelRule; maxTravelKm: number }) {
  const id = useId();
  const max = Math.max(1, Math.round(maxTravelKm));
  const free = Math.min(Math.max(0, rule.freeTravelKm), max);
  const [km, setKm] = useState(() => (free + 10 <= max ? Math.round(free) + 10 : Math.round(max / 2)));

  const fee = travelFeeCents(km, rule);
  const roundTrip = rule.travelDistanceMode === "round_trip";
  const extra = Math.max(0, km - rule.freeTravelKm);
  const perKm = formatEuro(rule.pricePerKmCents);
  const feeLabel = fee === 0 ? "Gratis" : formatEuro(fee);

  const explanation =
    extra === 0
      ? free > 0
        ? `Binnen ${kmLabel(rule.freeTravelKm)} km rijden we gratis naar je toe.`
        : "Voor deze afstand betaal je geen voorrijkosten."
      : roundTrip
        ? `${kmLabel(extra)} km boven de gratis afstand, heen en terug: ${kmLabel(extra * 2)} km × ${perKm}.`
        : `${kmLabel(extra)} km boven de gratis afstand: ${kmLabel(extra)} km × ${perKm}.`;

  const trackStyle = {
    "--fill": `${(km / max) * 100}%`,
    "--free": `${(free / max) * 100}%`,
  } as CSSProperties;

  return (
    <div className="rounded-panel bg-ink-900 p-5 shadow-panel ring-1 ring-line sm:p-8">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor={`${id}-km`} className="block text-sm font-medium text-steel-300">
            Afstand tot je adres
          </label>
          <p aria-hidden="true" className="figures mt-1 whitespace-nowrap font-display text-[2rem] font-semibold leading-tight tracking-[-0.03em] text-steel-50 sm:text-5xl">
            {km}
            <span className="ml-1.5 text-[0.5em] font-medium text-steel-300">km</span>
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-steel-300">Voorrijkosten</p>
          <p aria-hidden="true" className="figures mt-1 whitespace-nowrap font-display text-[2rem] font-semibold leading-tight tracking-[-0.03em] text-steel-50 sm:text-5xl">
            {feeLabel}
          </p>
        </div>
      </div>

      <input
        id={`${id}-km`}
        type="range"
        min={0}
        max={max}
        step={1}
        value={km}
        onChange={(event) => setKm(Number(event.target.value))}
        aria-valuetext={`${km} km, voorrijkosten ${fee === 0 ? "gratis" : formatEuro(fee)}`}
        className="km-range mt-5"
        style={trackStyle}
      />

      <div aria-hidden="true" className="figures mt-1 flex justify-between text-sm text-steel-400">
        <span>0 km</span>
        <span>{max} km</span>
      </div>

      <p className="figures mt-5 min-h-[3.25rem] text-[0.95rem] leading-relaxed text-steel-300 sm:min-h-0">{explanation}</p>

      {free > 0 ? (
        <p className="mt-3 flex items-center gap-2.5 text-sm text-steel-400">
          <span aria-hidden="true" className="h-1.5 w-6 shrink-0 rounded-full bg-cyan-400/25" />
          Gratis tot {kmLabel(rule.freeTravelKm)} km. Wij komen tot {kmLabel(maxTravelKm)} km afstand.
        </p>
      ) : (
        <p className="mt-3 text-sm text-steel-400">Wij komen tot {kmLabel(maxTravelKm)} km afstand.</p>
      )}
    </div>
  );
}
