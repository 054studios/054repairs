"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { CaretDown, Clock } from "@phosphor-icons/react";
import { buttonClass, labelClass, selectClass } from "@/components/ui/styles";
import { formatEuro } from "@/lib/money";
import {
  bookingHref,
  optionsFor,
  repairsForModel,
  resolveSelection,
  type PricedCatalogue,
  type Selection,
} from "./catalogue";
import { kmLabel, minutesLabel } from "./facts";

const panel = "rounded-hero bg-ink-900 p-5 shadow-raised ring-1 ring-line-strong sm:p-7";

// The hero's working price check. Model, repair and quality, then the fixed price and the time.
export function PriceCheck({
  catalogue,
  freeTravelKm,
}: {
  catalogue: PricedCatalogue | null;
  freeTravelKm: number | null;
}) {
  const first = catalogue?.models[0];
  const initial = catalogue && first ? resolveSelection(catalogue, first.id) : null;

  if (!catalogue || !initial) {
    return <EmptyPriceCheck />;
  }

  return <PriceCheckForm catalogue={catalogue} initial={initial} freeTravelKm={freeTravelKm} />;
}

function PriceCheckForm({
  catalogue,
  initial,
  freeTravelKm,
}: {
  catalogue: PricedCatalogue;
  initial: Selection;
  freeTravelKm: number | null;
}) {
  const [selection, setSelection] = useState(initial);
  const id = useId();

  const repairs = repairsForModel(catalogue, selection.modelId);
  const options = optionsFor(catalogue, selection.modelId, selection.repairTypeId);
  const option = options.find((item) => item.qualityId === selection.qualityId) ?? options[0];
  const qualityName = new Map(catalogue.qualities.map((quality) => [quality.id, quality.name]));
  const activeIndex = Math.max(0, options.indexOf(option));

  const brands = [...new Set(catalogue.models.map((model) => model.brand))];
  const travelNote =
    freeTravelKm && freeTravelKm > 0
      ? `Voorrijkosten betaal je alleen boven ${kmLabel(freeTravelKm)} km afstand.`
      : "Voorrijkosten zie je bij het boeken.";

  function chooseModel(modelId: string) {
    setSelection((current) => resolveSelection(catalogue, modelId, current.repairTypeId, current.qualityId) ?? current);
  }

  function chooseRepair(repairTypeId: string) {
    setSelection(
      (current) => resolveSelection(catalogue, current.modelId, repairTypeId, current.qualityId) ?? current,
    );
  }

  const euros = Math.floor(option.priceCents / 100).toLocaleString("nl-NL");
  const cents = String(option.priceCents % 100).padStart(2, "0");

  return (
    <section aria-labelledby={`${id}-titel`} className={panel}>
      <h2 id={`${id}-titel`} className="font-display text-xl font-semibold tracking-[-0.02em] text-steel-50">
        Wat kost jouw reparatie?
      </h2>

      <div className="mt-4 space-y-3.5">
        <div>
          <label htmlFor={`${id}-model`} className={labelClass}>
            Model
          </label>
          <div className="relative mt-1.5">
            <select
              id={`${id}-model`}
              value={selection.modelId}
              onChange={(event) => chooseModel(event.target.value)}
              className={selectClass}
            >
              {brands.length > 1
                ? brands.map((brand) => (
                    <optgroup key={brand} label={brand}>
                      {catalogue.models
                        .filter((model) => model.brand === brand)
                        .map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                    </optgroup>
                  ))
                : catalogue.models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
            </select>
            <CaretDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-steel-400"
            />
          </div>
        </div>

        <div>
          <label htmlFor={`${id}-reparatie`} className={labelClass}>
            Reparatie
          </label>
          <div className="relative mt-1.5">
            <select
              id={`${id}-reparatie`}
              value={selection.repairTypeId}
              onChange={(event) => chooseRepair(event.target.value)}
              className={selectClass}
            >
              {repairs.map((repair) => (
                <option key={repair.id} value={repair.id}>
                  {repair.name}
                </option>
              ))}
            </select>
            <CaretDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-steel-400"
            />
          </div>
        </div>

        <fieldset>
          <legend className={labelClass}>Kwaliteit</legend>
          <div
            className="relative mt-1.5 grid rounded-ui bg-ink-950/70 p-1"
            style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-1 left-1 rounded-[7px] bg-ink-700 ring-1 ring-cyan-400/55 transition-transform duration-200 ease-out-strong"
              style={{
                width: `calc((100% - 0.5rem) / ${options.length})`,
                transform: `translateX(${activeIndex * 100}%)`,
              }}
            />
            {options.map((item) => (
              <label key={item.qualityId} className="relative cursor-pointer">
                <input
                  type="radio"
                  name={`${id}-kwaliteit`}
                  value={item.qualityId}
                  checked={item.qualityId === option.qualityId}
                  onChange={() => setSelection((current) => ({ ...current, qualityId: item.qualityId }))}
                  className="peer sr-only"
                />
                <span className="flex min-h-11 items-center justify-center rounded-[7px] px-2 text-[0.95rem] font-medium text-steel-400 transition-colors duration-150 peer-checked:text-steel-50 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan-400 hover:text-steel-100">
                  {qualityName.get(item.qualityId) ?? "Kwaliteit"}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-5 border-t border-line pt-5">
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {`Prijs ${formatEuro(option.priceCents)}. Klaar in ${minutesLabel(option.durationMinutes)}.`}
        </p>
        <div aria-hidden="true" className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <p
            key={option.priceCents}
            className="figure-swap figures font-display text-[3.25rem] font-semibold leading-none tracking-[-0.03em] text-steel-50 sm:text-[3.75rem]"
          >
            <span className="mr-1.5 align-[0.42em] text-[0.42em] font-medium text-steel-300">€</span>
            {euros}
            <span className="align-[0.62em] text-[0.38em] font-medium text-steel-300">,{cents}</span>
          </p>
          <p className="figures flex items-center gap-1.5 pb-1 text-[0.95rem] text-steel-300">
            <Clock aria-hidden="true" className="size-[1.125rem] text-cyan-300" />
            Klaar in {minutesLabel(option.durationMinutes)}
          </p>
        </div>
        <p className="mt-3 text-sm leading-snug text-steel-400">{travelNote}</p>
      </div>

      <Link
        href={bookingHref({ ...selection, qualityId: option.qualityId })}
        className={`${buttonClass("primary", "lg")} mt-5 w-full`}
      >
        Boek deze reparatie
      </Link>
    </section>
  );
}

function EmptyPriceCheck() {
  return (
    <section aria-labelledby="prijscheck-leeg" className={panel}>
      <h2 id="prijscheck-leeg" className="font-display text-xl font-semibold tracking-[-0.02em] text-steel-50">
        Wat kost jouw reparatie?
      </h2>
      <p className="mt-3 text-base leading-relaxed text-steel-400">
        We kunnen de prijzen hier nu niet tonen. Bij het boeken zie je de vaste prijs voor jouw model en reparatie,
        voordat je iets betaalt.
      </p>
      <Link href="/boeken" className={`${buttonClass("primary", "lg")} mt-6 w-full`}>
        Boek een reparatie
      </Link>
    </section>
  );
}
