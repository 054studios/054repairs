import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

// Public, non-sensitive settings from public_settings(). The start address is never included.
export type PublicSettings = {
  businessName: string;
  phone: string | null;
  email: string | null;
  freeTravelKm: number;
  maxTravelKm: number;
  pricePerKmCents: number;
  travelDistanceMode: "round_trip" | "one_way";
  depositType: "fixed" | "percent";
  depositValue: number;
  allowFullPrepay: boolean;
  fullRefundHours: number;
  lateCancelRefundPercent: number;
  travelBufferMinutes: number;
  slotStepMinutes: number;
  bookingLeadHours: number;
  hasStartPoint: boolean;
};

export type Brand = { id: string; name: string; sortOrder: number };
export type DeviceModel = { id: string; brandId: string; name: string; sortOrder: number };
export type RepairType = { id: string; name: string; description: string | null; sortOrder: number };
export type Quality = { id: string; name: string; description: string | null; sortOrder: number };

// Effective duration: the price row's own duration when set, otherwise the repair type's duration.
export type Price = {
  modelId: string;
  repairTypeId: string;
  qualityId: string;
  priceCents: number;
  durationMinutes: number;
};

export type Catalogue = {
  brands: Brand[];
  models: DeviceModel[];
  repairTypes: RepairType[];
  qualities: Quality[];
  prices: Price[];
};

export type RepairSummary = {
  id: string;
  name: string;
  description: string | null;
  fromPriceCents: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
};

type BrandRow = { id: string; name: string; sort_order: number };
type ModelRow = { id: string; brand_id: string; name: string; sort_order: number };
type TypeRow = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  sort_order: number;
};
type QualityRow = { id: string; name: string; description: string | null; sort_order: number };
type PriceRow = {
  id: string;
  model_id: string;
  repair_type_id: string;
  quality_id: string;
  price_cents: number;
  duration_minutes: number | null;
};

type PageResult<T> = { data: T[] | null; error: { message: string } | null };

const PAGE_SIZE = 1000;

// The API returns at most 1000 rows per request, so the catalogue is read page by page.
async function fetchAll<T>(load: (from: number, to: number) => PromiseLike<PageResult<T>>): Promise<T[]> {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await load(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(error.message);
    }

    const page = data ?? [];
    rows.push(...page);

    if (page.length < PAGE_SIZE) {
      return rows;
    }
  }
}

const bySortOrder = <T extends { sortOrder: number; name: string }>(a: T, b: T) =>
  a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "nl");

// Returns null when the settings cannot be read, so pages can show a fallback text.
export const getPublicSettings = cache(async (): Promise<PublicSettings | null> => {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.rpc("public_settings");

    if (error || !data) {
      return null;
    }

    return data as PublicSettings;
  } catch (error) {
    console.error("Instellingen konden niet worden geladen", error);
    return null;
  }
});

// Returns null when the catalogue cannot be read. Inactive rows are hidden by RLS.
export const getCatalogue = cache(async (): Promise<Catalogue | null> => {
  try {
    const supabase = createPublicClient();

    const [brandRows, modelRows, typeRows, qualityRows, priceRows] = await Promise.all([
      fetchAll<BrandRow>((from, to) =>
        supabase.from("brands").select("id, name, sort_order").order("id").range(from, to),
      ),
      fetchAll<ModelRow>((from, to) =>
        supabase.from("device_models").select("id, brand_id, name, sort_order").order("id").range(from, to),
      ),
      fetchAll<TypeRow>((from, to) =>
        supabase
          .from("repair_types")
          .select("id, name, description, duration_minutes, sort_order")
          .order("id")
          .range(from, to),
      ),
      fetchAll<QualityRow>((from, to) =>
        supabase.from("repair_qualities").select("id, name, description, sort_order").order("id").range(from, to),
      ),
      fetchAll<PriceRow>((from, to) =>
        supabase
          .from("repair_prices")
          .select("id, model_id, repair_type_id, quality_id, price_cents, duration_minutes")
          .order("id")
          .range(from, to),
      ),
    ]);

    const typeDuration = new Map(typeRows.map((row) => [row.id, row.duration_minutes]));

    return {
      brands: brandRows
        .map((row) => ({ id: row.id, name: row.name, sortOrder: row.sort_order }))
        .sort(bySortOrder),
      models: modelRows
        .map((row) => ({ id: row.id, brandId: row.brand_id, name: row.name, sortOrder: row.sort_order }))
        .sort(bySortOrder),
      repairTypes: typeRows
        .map((row) => ({ id: row.id, name: row.name, description: row.description, sortOrder: row.sort_order }))
        .sort(bySortOrder),
      qualities: qualityRows
        .map((row) => ({ id: row.id, name: row.name, description: row.description, sortOrder: row.sort_order }))
        .sort(bySortOrder),
      prices: priceRows.flatMap((row) => {
        const duration = row.duration_minutes ?? typeDuration.get(row.repair_type_id);

        if (duration === undefined) {
          return [];
        }

        return [
          {
            modelId: row.model_id,
            repairTypeId: row.repair_type_id,
            qualityId: row.quality_id,
            priceCents: row.price_cents,
            durationMinutes: duration,
          },
        ];
      }),
    };
  } catch (error) {
    console.error("Catalogus kon niet worden geladen", error);
    return null;
  }
});

// One entry per repair type that has at least one price, with the lowest price and the duration range.
export function summarizeRepairs(catalogue: Catalogue): RepairSummary[] {
  return catalogue.repairTypes.flatMap((type) => {
    const rows = catalogue.prices.filter((price) => price.repairTypeId === type.id);

    if (rows.length === 0) {
      return [];
    }

    const durations = rows.map((row) => row.durationMinutes);

    return [
      {
        id: type.id,
        name: type.name,
        description: type.description,
        fromPriceCents: Math.min(...rows.map((row) => row.priceCents)),
        minDurationMinutes: Math.min(...durations),
        maxDurationMinutes: Math.max(...durations),
      },
    ];
  });
}

export function durationRange(catalogue: Catalogue): { min: number; max: number } | null {
  if (catalogue.prices.length === 0) {
    return null;
  }

  const durations = catalogue.prices.map((price) => price.durationMinutes);
  return { min: Math.min(...durations), max: Math.max(...durations) };
}
