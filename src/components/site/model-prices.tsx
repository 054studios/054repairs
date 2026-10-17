"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { labelClass, selectClass } from "@/components/ui/styles";
import { formatEuro } from "@/lib/money";
import { bookingHref, modelTable, type PricedCatalogue } from "./catalogue";

function durationText(min: number, max: number) {
  return min === max ? `${min} min` : `${min} tot ${max} min`;
}

// Prices page: pick a model, see every repair in every quality. A price is also the way to book it.
export function ModelPrices({ catalogue }: { catalogue: PricedCatalogue }) {
  const id = useId();
  const [modelId, setModelId] = useState(catalogue.models[0]?.id ?? "");
  const model = catalogue.models.find((item) => item.id === modelId);
  const rows = modelTable(catalogue, modelId);
  const brands = [...new Set(catalogue.models.map((item) => item.brand))];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div className="w-full sm:max-w-xs">
          <label htmlFor={`${id}-model`} className={labelClass}>
            Kies je model
          </label>
          <div className="relative mt-1.5">
            <select
              id={`${id}-model`}
              value={modelId}
              onChange={(event) => setModelId(event.target.value)}
              className={selectClass}
            >
              {brands.length > 1
                ? brands.map((brand) => (
                    <optgroup key={brand} label={brand}>
                      {catalogue.models
                        .filter((item) => item.brand === brand)
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                    </optgroup>
                  ))
                : catalogue.models.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
            </select>
            <CaretDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-steel-400"
            />
          </div>
        </div>
        <p className="text-sm text-steel-400 sm:pb-3">Tik op een prijs om die reparatie te boeken.</p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-panel bg-ink-900 shadow-panel ring-1 ring-line">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Prijzen voor de {model?.name ?? "gekozen iPhone"}, per reparatie en kwaliteit</caption>
          <thead>
            <tr className="border-b border-line-strong text-sm text-steel-400">
              <th scope="col" className="px-4 py-3.5 font-medium sm:px-6">
                Reparatie
              </th>
              {catalogue.qualities.map((quality) => (
                <th key={quality.id} scope="col" className="px-3 py-3.5 text-right font-medium sm:px-6">
                  {quality.name}
                </th>
              ))}
              <th scope="col" className="hidden px-6 py-3.5 text-right font-medium sm:table-cell">
                Duur
              </th>
            </tr>
          </thead>
          <tbody key={modelId} className="table-arrive divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.repair.id}>
                <th scope="row" className="px-4 py-3 align-middle font-medium text-steel-100 sm:px-6">
                  {row.repair.name}
                  <span className="figures mt-0.5 block text-sm font-normal text-steel-400 sm:hidden">
                    {durationText(row.minMinutes, row.maxMinutes)}
                  </span>
                </th>
                {row.cells.map((cell, index) => (
                  <td key={catalogue.qualities[index].id} className="px-1 py-2 text-right sm:px-3">
                    {cell ? (
                      <Link
                        href={bookingHref({ modelId, repairTypeId: cell.repairTypeId, qualityId: cell.qualityId })}
                        aria-label={`Boek ${row.repair.name}, ${catalogue.qualities[index].name}, voor ${formatEuro(cell.priceCents)}`}
                        className="figures inline-flex min-h-11 items-center whitespace-nowrap rounded-ui px-2 text-steel-50 transition-colors duration-150 hover:bg-ink-800 hover:text-cyan-200 sm:px-3"
                      >
                        {formatEuro(cell.priceCents)}
                      </Link>
                    ) : (
                      <span className="inline-flex min-h-11 items-center px-2 text-steel-500 sm:px-3">
                        <span aria-hidden="true">-</span>
                        <span className="sr-only">Niet beschikbaar</span>
                      </span>
                    )}
                  </td>
                ))}
                <td className="figures hidden whitespace-nowrap px-6 py-3 text-right text-steel-300 sm:table-cell">
                  {durationText(row.minMinutes, row.maxMinutes)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
