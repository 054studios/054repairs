import { DeviceMobileIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { buttonClass, inputClass, labelClass, optionClass, stepPanelClass } from "@/lib/booking/styles";
import type { Brand, DeviceModel } from "@/lib/booking/types";
import { StepHeading } from "./step-heading";

// A search field only helps once the list is longer than a screen.
const SEARCH_FROM = 7;

export function StepDevice({
  brands,
  models,
  brandId,
  modelId,
  phone,
  onBrand,
  onModel,
}: {
  brands: Brand[];
  models: DeviceModel[];
  brandId: string | null;
  modelId: string | null;
  phone: string | null;
  onBrand: (brandId: string) => void;
  onModel: (modelId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();

  const inBrand = models.filter((model) => brandId === null || model.brandId === brandId);
  const visible = inBrand.filter((model) => model.name.toLowerCase().includes(term));

  return (
    <>
      <StepHeading title="Welk toestel repareren wij?" text="Kies het model van je telefoon. Daarna zie je direct de prijzen." />

      <div className={stepPanelClass}>
        {models.length === 0 ? (
          <div className="py-4">
            <p className="font-medium text-steel-100">Er zijn nu geen toestellen online te boeken.</p>
            <p className="mt-1 text-[0.9375rem] text-steel-400">
              {phone ? `Bel ons op ${phone}, dan plannen wij de reparatie met je in.` : "Probeer het later opnieuw."}
            </p>
          </div>
        ) : (
          <>
            {brands.length > 1 && (
              <div role="radiogroup" aria-label="Merk" className="mb-5 flex flex-wrap gap-2">
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
                    <span className={`${optionClass} flex min-h-11 items-center px-4 py-2 text-sm font-medium text-steel-100`}>
                      {brand.name}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {inBrand.length >= SEARCH_FROM && (
              <div className="mb-5">
                <label htmlFor="model-search" className={labelClass}>
                  Zoek je model
                </label>
                <div className="relative mt-2">
                  <MagnifyingGlassIcon
                    size={20}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-steel-400"
                  />
                  <input
                    id="model-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Bijvoorbeeld iPhone 13"
                    autoComplete="off"
                    enterKeyHint="search"
                    className={`${inputClass} pl-11`}
                  />
                </div>
              </div>
            )}

            {visible.length === 0 ? (
              <div className="rounded-ui py-8 text-center" role="status">
                {term === "" ? (
                  <p className="font-medium text-steel-100">Voor dit merk zijn nog geen modellen online te boeken.</p>
                ) : (
                  <>
                    <p className="font-medium text-steel-100">Geen model gevonden voor &ldquo;{query.trim()}&rdquo;.</p>
                    <p className="mx-auto mt-1 max-w-[28rem] text-[0.9375rem] text-steel-400">
                      Controleer de schrijfwijze, of wis de zoekopdracht en kies uit de hele lijst.
                    </p>
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className={`${buttonClass("secondary", "md")} mt-4`}
                    >
                      Wis zoekopdracht
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div role="radiogroup" aria-label="Model" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {visible.map((model) => {
                  const selected = modelId === model.id;

                  return (
                    <label
                      key={model.id}
                      className="block cursor-pointer transition-transform duration-150 ease-out-strong active:scale-[0.98]"
                    >
                      <input
                        type="radio"
                        name="model"
                        value={model.id}
                        checked={selected}
                        onChange={() => onModel(model.id)}
                        className="peer sr-only"
                      />
                      <span
                        className={`${optionClass} flex h-full min-h-[5.5rem] flex-col justify-between gap-3`}
                      >
                        <DeviceMobileIcon
                          size={20}
                          aria-hidden="true"
                          className={`transition-colors duration-150 ${selected ? "text-cyan-400" : "text-steel-400"}`}
                        />
                        <span className="break-words text-[0.9375rem] font-medium leading-snug text-steel-50">
                          {model.name}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
