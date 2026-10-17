"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { safely, savedResult, type ActionResult } from "@/lib/action-result";
import { parseEuroToCents } from "@/lib/money";
import { slugify } from "@/lib/slug";

const PATH = "/admin/catalogus";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function flag(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

function whole(formData: FormData, key: string, label: string, min = 0): number {
  const value = Number(text(formData, key));

  if (!Number.isInteger(value) || value < min) {
    throw new Error(`${label} moet een geheel getal van ${min} of hoger zijn.`);
  }

  return value;
}

function required(formData: FormData, key: string, label: string): string {
  const value = text(formData, key);

  if (!value) {
    throw new Error(`Vul ${label} in.`);
  }

  return value;
}

export async function createModel(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return safely(async () => {
    const { supabase } = await requireAdmin();
    const name = required(formData, "name", "een modelnaam");
    const brandId = required(formData, "brand_id", "een merk");

    const { error } = await supabase.from("device_models").insert({
      brand_id: brandId,
      name,
      slug: slugify(name),
      sort_order: whole(formData, "sort_order", "Volgorde"),
      active: true,
    });

    if (error) throw new Error("Dit model bestaat al of kon niet worden opgeslagen.");

    updateTag("public-catalogue");
    revalidatePath(PATH);
    return savedResult;
  });
}

export async function updateModel(id: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return safely(async () => {
    const { supabase } = await requireAdmin();

    const { error } = await supabase
      .from("device_models")
      .update({
        name: required(formData, "name", "een modelnaam"),
        sort_order: whole(formData, "sort_order", "Volgorde"),
        active: flag(formData, "active"),
      })
      .eq("id", id);

    if (error) throw new Error("Opslaan is mislukt.");

    updateTag("public-catalogue");
    revalidatePath(PATH);
    return savedResult;
  });
}

export async function createRepairType(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return safely(async () => {
    const { supabase } = await requireAdmin();

    const { error } = await supabase.from("repair_types").insert({
      name: required(formData, "name", "een naam voor de reparatie"),
      description: text(formData, "description") || null,
      duration_minutes: whole(formData, "duration_minutes", "De duur", 5),
      sort_order: whole(formData, "sort_order", "Volgorde"),
      active: true,
    });

    if (error) throw new Error("Opslaan is mislukt.");

    updateTag("public-catalogue");
    revalidatePath(PATH);
    return savedResult;
  });
}

export async function updateRepairType(id: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return safely(async () => {
    const { supabase } = await requireAdmin();

    const { error } = await supabase
      .from("repair_types")
      .update({
        name: required(formData, "name", "een naam voor de reparatie"),
        description: text(formData, "description") || null,
        duration_minutes: whole(formData, "duration_minutes", "De duur", 5),
        sort_order: whole(formData, "sort_order", "Volgorde"),
        active: flag(formData, "active"),
      })
      .eq("id", id);

    if (error) throw new Error("Opslaan is mislukt.");

    updateTag("public-catalogue");
    revalidatePath(PATH);
    return savedResult;
  });
}

export async function createQuality(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return safely(async () => {
    const { supabase } = await requireAdmin();

    const { error } = await supabase.from("repair_qualities").insert({
      name: required(formData, "name", "een naam voor de kwaliteit"),
      description: text(formData, "description") || null,
      sort_order: whole(formData, "sort_order", "Volgorde"),
      active: true,
    });

    if (error) throw new Error("Opslaan is mislukt.");

    updateTag("public-catalogue");
    revalidatePath(PATH);
    return savedResult;
  });
}

export async function updateQuality(id: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return safely(async () => {
    const { supabase } = await requireAdmin();

    const { error } = await supabase
      .from("repair_qualities")
      .update({
        name: required(formData, "name", "een naam voor de kwaliteit"),
        description: text(formData, "description") || null,
        sort_order: whole(formData, "sort_order", "Volgorde"),
        active: flag(formData, "active"),
      })
      .eq("id", id);

    if (error) throw new Error("Opslaan is mislukt.");

    updateTag("public-catalogue");
    revalidatePath(PATH);
    return savedResult;
  });
}

// Prices form: one input per repair × quality, named price:<repairId>:<qualityId>.
// An empty input removes that price.
export async function savePrices(modelId: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return safely(async () => {
    const { supabase } = await requireAdmin();

    const [{ data: repairTypes }, { data: qualities }, { data: existing }] = await Promise.all([
      supabase.from("repair_types").select("id"),
      supabase.from("repair_qualities").select("id"),
      supabase.from("repair_prices").select("id, repair_type_id, quality_id").eq("model_id", modelId),
    ]);

    const existingByKey = new Map(
      (existing ?? []).map((row) => [`${row.repair_type_id}:${row.quality_id}`, row.id]),
    );

    const upserts: Array<{
      model_id: string;
      repair_type_id: string;
      quality_id: string;
      price_cents: number;
      active: boolean;
    }> = [];
    const deleteIds: string[] = [];

    for (const repair of repairTypes ?? []) {
      for (const quality of qualities ?? []) {
        const key = `${repair.id}:${quality.id}`;
        const raw = text(formData, `price:${key}`);
        const cents = parseEuroToCents(raw);

        if (cents === null) {
          const id = existingByKey.get(key);
          if (id) deleteIds.push(id);
          continue;
        }

        upserts.push({
          model_id: modelId,
          repair_type_id: repair.id,
          quality_id: quality.id,
          price_cents: cents,
          active: true,
        });
      }
    }

    if (deleteIds.length > 0) {
      const { error } = await supabase.from("repair_prices").delete().in("id", deleteIds);
      if (error) throw new Error("Verwijderen van prijzen is mislukt.");
    }

    if (upserts.length > 0) {
      const { error } = await supabase
        .from("repair_prices")
        .upsert(upserts, { onConflict: "model_id,repair_type_id,quality_id" });
      if (error) throw new Error("Opslaan van prijzen is mislukt.");
    }

    updateTag("public-catalogue");
    revalidatePath(PATH);
    return savedResult;
  });
}
