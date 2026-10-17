import "server-only";
import { z } from "zod";
import { isMollieConfigured } from "@/lib/payments/mollie";
import { createClient } from "@/lib/supabase/server";
import {
  brandRowSchema,
  modelRowSchema,
  priceRowSchema,
  publicSettingsSchema,
  qualityRowSchema,
  repairTypeRowSchema,
} from "./schema";
import type { BookingCatalog, PublicSettings, RepairOption } from "./types";

export type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export async function loadPublicSettings(
  supabase: SupabaseServer,
): Promise<PublicSettings | null> {
  const { data, error } = await supabase.rpc("public_settings");

  if (error) {
    return null;
  }

  const parsed = publicSettingsSchema.safeParse(data);

  if (!parsed.success) {
    return null;
  }

  const settings = parsed.data;

  return {
    ...settings,
    businessName: settings.businessName ?? "054repairs",
    phone: settings.phone ?? null,
    email: settings.email ?? null,
  };
}

// Active brands, models, repair types and qualities. RLS only returns active rows.
// Prices are loaded per model (see loadModelOptions) to stay below the API row limit.
export async function loadBookingCatalog(): Promise<BookingCatalog | null> {
  const supabase = await createClient();

  const [brands, models, repairTypes, qualities, settings, mollieReady] =
    await Promise.all([
      supabase.from("brands").select("id, name").order("name"),
      supabase
        .from("device_models")
        .select("id, brand_id, name")
        .order("sort_order")
        .order("name"),
      supabase
        .from("repair_types")
        .select("id, name, description, duration_minutes")
        .order("sort_order"),
      supabase
        .from("repair_qualities")
        .select("id, name, description")
        .order("sort_order"),
      loadPublicSettings(supabase),
      isMollieConfigured().catch(() => false),
    ]);

  if (
    brands.error ||
    models.error ||
    repairTypes.error ||
    qualities.error ||
    !settings
  ) {
    return null;
  }

  const brandRows = z.array(brandRowSchema).safeParse(brands.data);
  const modelRows = z.array(modelRowSchema).safeParse(models.data);
  const repairTypeRows = z
    .array(repairTypeRowSchema)
    .safeParse(repairTypes.data);
  const qualityRows = z.array(qualityRowSchema).safeParse(qualities.data);

  if (
    !brandRows.success ||
    !modelRows.success ||
    !repairTypeRows.success ||
    !qualityRows.success
  ) {
    return null;
  }

  return {
    brands: brandRows.data.map((row) => ({ id: row.id, name: row.name })),
    models: modelRows.data.map((row) => ({
      id: row.id,
      brandId: row.brand_id,
      name: row.name,
    })),
    repairTypes: repairTypeRows.data.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? null,
      durationMinutes: row.duration_minutes,
    })),
    qualities: qualityRows.data.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? null,
    })),
    settings,
    mollieReady,
  };
}

// Priced combinations for one model. Only these combinations can be booked.
export async function loadModelOptions(
  supabase: SupabaseServer,
  modelId: string,
): Promise<RepairOption[] | null> {
  const [prices, types, stock] = await Promise.all([
    supabase
      .from("repair_prices")
      .select("repair_type_id, quality_id, price_cents, duration_minutes")
      .eq("model_id", modelId),
    supabase.from("repair_types").select("id, duration_minutes"),
    supabase.rpc("stock_available_options", { p_model: modelId }),
  ]);

  if (prices.error || types.error) {
    return null;
  }

  const priceRows = z.array(priceRowSchema).safeParse(prices.data);
  const typeRows = z
    .array(z.object({ id: z.string(), duration_minutes: z.number() }))
    .safeParse(types.data);

  if (!priceRows.success || !typeRows.success) {
    return null;
  }

  const defaultDuration = new Map(
    typeRows.data.map((row) => [row.id, row.duration_minutes]),
  );

  if (stock.error && !["PGRST202", "42883"].includes(stock.error.code))
    return null;
  const available = stock.error
    ? null
    : z
        .array(z.object({ repair_type_id: z.string(), quality_id: z.string() }))
        .safeParse(stock.data);
  if (available && !available.success) return null;
  return priceRows.data
    .filter(
      (row) =>
        !available ||
        (available.success &&
          available.data.some(
            (a) =>
              a.repair_type_id === row.repair_type_id &&
              a.quality_id === row.quality_id,
          )),
    )
    .map((row) => ({
      repairTypeId: row.repair_type_id,
      qualityId: row.quality_id,
      priceCents: row.price_cents,
      durationMinutes:
        row.duration_minutes ?? defaultDuration.get(row.repair_type_id) ?? 0,
    }));
}
