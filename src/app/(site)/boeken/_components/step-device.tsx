import { useState } from "react";
import { optionClass } from "@/lib/booking/styles";
import type { Brand, DeviceModel } from "@/lib/booking/types";
import { StepHeading } from "./step-heading";

export function StepDevice({
  brands,
  models,
  brandId,
  modelId,
  onBrand,
  onModel,
}: {
  brands: Brand[];
  models: DeviceModel[];
  brandId: string | null;
  modelId: string | null;
  onBrand: (brandId: string) => void;
  onModel: (modelId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();

  const visible = models.filter(
    (model) => (brandId === null || model.brandId === brandId) && model.name.toLowerCase().includes(term),
  );

  return (
    <>
      <StepHeading title="Welk toestel repareren we?" text="Kies het merk en het model." />

      {brands.length > 1 && (
        <div role="radiogroup" aria-label="Merk" className="mb-4 flex flex-wrap gap-2">
          {brands.map((brand) => (
            <label key={brand.id} className="cursor-pointer">
              <input
                type="radio"
                name="brand"
                value={brand.id}
                checked={brandId === brand.id}
                onChange={() => onBrand(brand.id)}
                className="peer sr-only"
              />
              <span className="inline-block rounded-full bg-white px-4 py-2 text-sm font-medium text-navy-900 ring-1 ring-navy-200 transition peer-checked:bg-navy-900 peer-checked:text-white peer-checked:ring-navy-900 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-navy-600">
                {brand.name}
              </span>
            </label>
          ))}
        </div>
      )}

      <label htmlFor="model-search" className="sr-only">
        Zoek een model
      </label>
      <input
        id="model-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Zoek een model"
        className="w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-base text-navy-950 outline-none transition placeholder:text-navy-400 focus:border-navy-600 focus:ring-2 focus:ring-navy-600/20"
      />

      <div role="radiogroup" aria-label="Model" className="mt-4 grid gap-2">
        {visible.length === 0 ? (
          <p className="py-6 text-center text-base text-navy-600">Geen modellen gevonden.</p>
        ) : (
          visible.map((model) => (
            <label key={model.id} className="cursor-pointer">
              <input
                type="radio"
                name="model"
                value={model.id}
                checked={modelId === model.id}
                onChange={() => onModel(model.id)}
                className="peer sr-only"
              />
              <span className={`${optionClass} flex items-center justify-between gap-3 py-3.5 text-base font-medium text-navy-950`}>
                <span className="min-w-0 break-words">{model.name}</span>
                <span
                  aria-hidden="true"
                  className={`size-5 shrink-0 rounded-full ring-2 transition ${
                    modelId === model.id ? "bg-navy-900 ring-navy-900" : "ring-navy-300"
                  }`}
                />
              </span>
            </label>
          ))
        )}
      </div>
    </>
  );
}
