import type { Catalogue, Price } from "./data";

// Pure helpers over the catalogue. No server-only imports, so the client islands use them too.

export type Option = { id: string; name: string };
export type PricedModel = { id: string; name: string; brand: string };

// Only what has a price, in the order set in the admin. This is what the price islands receive.
export type PricedCatalogue = {
  models: PricedModel[];
  repairs: Option[];
  qualities: Option[];
  prices: Price[];
};

export type Selection = { modelId: string; repairTypeId: string; qualityId: string };

export function pricedCatalogue(catalogue: Catalogue): PricedCatalogue {
  const brandIds = new Set(catalogue.brands.map((brand) => brand.id));
  const modelIds = new Set(catalogue.models.filter((model) => brandIds.has(model.brandId)).map((model) => model.id));
  const repairIds = new Set(catalogue.repairTypes.map((type) => type.id));
  const qualityIds = new Set(catalogue.qualities.map((quality) => quality.id));

  const prices = catalogue.prices.filter(
    (price) => modelIds.has(price.modelId) && repairIds.has(price.repairTypeId) && qualityIds.has(price.qualityId),
  );

  const pricedModels = new Set(prices.map((price) => price.modelId));
  const pricedRepairs = new Set(prices.map((price) => price.repairTypeId));
  const pricedQualities = new Set(prices.map((price) => price.qualityId));

  return {
    models: catalogue.brands.flatMap((brand) =>
      catalogue.models
        .filter((model) => model.brandId === brand.id && pricedModels.has(model.id))
        .map((model) => ({ id: model.id, name: model.name, brand: brand.name })),
    ),
    repairs: catalogue.repairTypes
      .filter((type) => pricedRepairs.has(type.id))
      .map((type) => ({ id: type.id, name: type.name })),
    qualities: catalogue.qualities
      .filter((quality) => pricedQualities.has(quality.id))
      .map((quality) => ({ id: quality.id, name: quality.name })),
    prices,
  };
}

export function repairsForModel(priced: PricedCatalogue, modelId: string): Option[] {
  const ids = new Set(priced.prices.filter((price) => price.modelId === modelId).map((price) => price.repairTypeId));
  return priced.repairs.filter((repair) => ids.has(repair.id));
}

// The priced qualities for one model and repair, in the admin order of the qualities.
export function optionsFor(priced: PricedCatalogue, modelId: string, repairTypeId: string): Price[] {
  const order = new Map(priced.qualities.map((quality, index) => [quality.id, index]));

  return priced.prices
    .filter((price) => price.modelId === modelId && price.repairTypeId === repairTypeId)
    .sort((a, b) => (order.get(a.qualityId) ?? 0) - (order.get(b.qualityId) ?? 0));
}

function cheapest(options: Price[]): Price | undefined {
  return options.reduce<Price | undefined>(
    (best, option) => (best === undefined || option.priceCents < best.priceCents ? option : best),
    undefined,
  );
}

// Keeps the visitor's repair and quality when the new model has them, otherwise falls back to the
// first repair and the cheapest quality.
export function resolveSelection(
  priced: PricedCatalogue,
  modelId: string,
  repairTypeId?: string,
  qualityId?: string,
): Selection | null {
  const repairs = repairsForModel(priced, modelId);
  const repair = repairs.find((item) => item.id === repairTypeId) ?? repairs[0];

  if (!repair) {
    return null;
  }

  const options = optionsFor(priced, modelId, repair.id);
  const option = options.find((item) => item.qualityId === qualityId) ?? cheapest(options);

  return option ? { modelId, repairTypeId: repair.id, qualityId: option.qualityId } : null;
}

export function bookingHref(selection: Partial<Selection>): string {
  const params = new URLSearchParams();

  if (selection.modelId) params.set("model", selection.modelId);
  if (selection.repairTypeId) params.set("repair", selection.repairTypeId);
  if (selection.qualityId) params.set("quality", selection.qualityId);

  const query = params.toString();
  return query ? `/boeken?${query}` : "/boeken";
}

// Home page preview: the "vanaf" price per model for the most asked repairs (screen and battery).
export type FromPriceTable = {
  repairs: Option[];
  rows: { model: PricedModel; from: (number | null)[] }[];
};

export function fromPriceTable(priced: PricedCatalogue): FromPriceTable | null {
  const wanted = [/scherm/i, /batterij|accu/i]
    .map((pattern) => priced.repairs.find((repair) => pattern.test(repair.name)))
    .filter((repair): repair is Option => repair !== undefined);

  const repairs = [...wanted];

  for (const repair of priced.repairs) {
    if (repairs.length >= 2) break;
    if (!repairs.some((item) => item.id === repair.id)) repairs.push(repair);
  }

  if (repairs.length === 0) {
    return null;
  }

  const rows = priced.models
    .map((model) => ({
      model,
      from: repairs.map((repair) => {
        const option = cheapest(optionsFor(priced, model.id, repair.id));
        return option ? option.priceCents : null;
      }),
    }))
    .filter((row) => row.from.some((value) => value !== null));

  return rows.length > 0 ? { repairs, rows } : null;
}

// Prices page: every repair for one model, a column per quality, plus the duration.
export type ModelTableRow = {
  repair: Option;
  cells: (Price | null)[];
  minMinutes: number;
  maxMinutes: number;
};

export function modelTable(priced: PricedCatalogue, modelId: string): ModelTableRow[] {
  return repairsForModel(priced, modelId).map((repair) => {
    const options = optionsFor(priced, modelId, repair.id);
    const durations = options.map((option) => option.durationMinutes);

    return {
      repair,
      cells: priced.qualities.map((quality) => options.find((option) => option.qualityId === quality.id) ?? null),
      minMinutes: Math.min(...durations),
      maxMinutes: Math.max(...durations),
    };
  });
}

export function durationRangeOf(priced: PricedCatalogue): { min: number; max: number } | null {
  if (priced.prices.length === 0) {
    return null;
  }

  const durations = priced.prices.map((price) => price.durationMinutes);
  return { min: Math.min(...durations), max: Math.max(...durations) };
}
