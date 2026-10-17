"use server";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { safely, type ActionResult } from "@/lib/action-result";
import { checksSchema, safeHttps } from "@/lib/operations";
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const integer = (f: FormData, k: string, min: number, max: number) =>
  z.coerce.number().int().min(min).max(max).parse(str(f, k));
const uuid = z.uuid();
export async function saveOperations(
  _p: ActionResult | null,
  f: FormData,
): Promise<ActionResult> {
  return safely(async () => {
    const { supabase } = await requireAdmin();
    const review = str(f, "review_url");
    if (review && !safeHttps(review))
      throw Error("Gebruik een volledige https-link voor reviews.");
    const vat = str(f, "vat_percent");
    const patch = {
      route_planning: f.get("route_planning") === "on",
      average_kmh: integer(f, "average_kmh", 10, 130),
      arrival_margin_minutes: integer(f, "arrival_margin_minutes", 0, 120),
      reschedule_hours: integer(f, "reschedule_hours", 1, 168),
      legal_name: str(f, "legal_name").slice(0, 150),
      business_address: str(f, "business_address").slice(0, 400),
      kvk_number: str(f, "kvk_number"),
      vat_number: str(f, "vat_number").slice(0, 40),
      vat_percent:
        vat === "" ? null : z.coerce.number().min(0).max(100).parse(vat),
      tax_note: str(f, "tax_note").slice(0, 500),
      review_url: review.slice(0, 1500),
      updated_at: new Date().toISOString(),
    };
    if (patch.route_planning) {
      const { data } = await supabase
        .from("settings")
        .select("start_lat,start_lng")
        .eq("id", 1)
        .single();
      if (data?.start_lat == null || data?.start_lng == null)
        throw Error("Stel eerst het vertrekadres in bij Voorrijkosten.");
    }
    const { error } = await supabase
      .from("operations_settings")
      .update(patch)
      .eq("id", 1);
    if (error)
      throw Error(
        "Instellingen niet opgeslagen. Controleer de migratie en invoer.",
      );
    updateTag("site-content");
    revalidatePath("/admin/bedrijfsvoering");
    revalidatePath("/admin/werkdag");
    return { ok: true, message: "Instellingen opgeslagen." };
  });
}
export async function saveStock(
  _p: ActionResult | null,
  f: FormData,
): Promise<ActionResult> {
  return safely(async () => {
    const { supabase } = await requireAdmin();
    const price = uuid.parse(str(f, "price_id"));
    const { data } = await supabase
      .from("repair_prices")
      .select("model_id,repair_type_id,quality_id")
      .eq("id", price)
      .single();
    if (!data) throw Error("Kies een combinatie uit de catalogus.");
    const { error } = await supabase.rpc("save_stock", {
      p_model: data.model_id,
      p_repair: data.repair_type_id,
      p_quality: data.quality_id,
      p_on_hand: integer(f, "on_hand", 0, 100000),
      p_minimum: integer(f, "minimum", 0, 100000),
    });
    if (error)
      throw Error(
        "Voorraad niet opgeslagen. Het fysieke aantal mag niet lager zijn dan het gereserveerde aantal.",
      );
    revalidatePath("/admin/voorraad");
    return { ok: true, message: "Voorraad bijgewerkt." };
  });
}
export async function saveReport(
  id: string,
  _p: ActionResult | null,
  f: FormData,
): Promise<ActionResult> {
  void _p;
  return safely(async () => {
    const { supabase } = await requireAdmin();
    uuid.parse(id);
    const checks = checksSchema.parse(
      Object.fromEntries(
        ["touchscreen", "camera", "charging", "sound"].map((k) => [
          k,
          str(f, k),
        ]),
      ),
    );
    const { error } = await supabase.rpc("save_repair_report", {
      p_id: id,
      p_checks: checks,
      p_notes: z.string().max(4000).parse(str(f, "work_notes")),
      p_published: f.get("published") === "on",
    });
    if (error)
      throw Error(
        "Rapport niet opgeslagen. Vul bij publicatie ook het uitgevoerde werk in.",
      );
    revalidatePath("/admin/afspraken/" + id);
    return { ok: true, message: "Reparatierapport opgeslagen." };
  });
}
export async function issueInvoice(id: string): Promise<ActionResult> {
  return safely(async () => {
    const { supabase } = await requireAdmin();
    uuid.parse(id);
    const { data, error } = await supabase.rpc("issue_invoice", { p_id: id });
    if (error)
      throw Error(
        "Factuur niet aangemaakt. Controleer de factuurinstellingen en rond de reparatie eerst af als Teruggebracht.",
      );
    revalidatePath("/admin/afspraken/" + id);
    return { ok: true, message: "Factuur " + data + " vastgelegd." };
  });
}
export async function savePhoto(
  _p: ActionResult | null,
  f: FormData,
): Promise<ActionResult> {
  return safely(async () => {
    const { supabase } = await requireAdmin();
    const url = str(f, "image_url");
    if (!safeHttps(url))
      throw Error("Vul een volledige https-link naar je eigen foto in.");
    const consent = f.get("consent") === "on",
      published = f.get("published") === "on";
    if (published && !consent)
      throw Error("Bevestig eerst dat je deze foto mag publiceren.");
    const { error } = await supabase
      .from("site_photos")
      .insert({
        image_url: z.string().max(1500).parse(url),
        alt: z.string().min(5).max(200).parse(str(f, "alt")),
        caption: z.string().max(300).parse(str(f, "caption")),
        consent_confirmed: consent,
        published,
      });
    if (error) throw Error("Foto niet opgeslagen.");
    updateTag("site-content");
    revalidatePath("/admin/publicatie");
    return { ok: true, message: "Foto toegevoegd." };
  });
}
export async function deletePhoto(id: string): Promise<ActionResult> {
  return safely(async () => {
    const { supabase } = await requireAdmin();
    uuid.parse(id);
    const { error } = await supabase.from("site_photos").delete().eq("id", id);
    if (error) throw Error("Verwijderen mislukt.");
    updateTag("site-content");
    revalidatePath("/admin/publicatie");
    return { ok: true, message: "Foto verwijderd." };
  });
}
export async function togglePhoto(
  id: string,
  publish: boolean,
): Promise<ActionResult> {
  return safely(async () => {
    const { supabase } = await requireAdmin();
    uuid.parse(id);
    const { error } = await supabase
      .from("site_photos")
      .update({ published: publish })
      .eq("id", id)
      .eq("consent_confirmed", true);
    if (error) throw Error("Publiceren mislukt. Controleer de toestemming.");
    updateTag("site-content");
    revalidatePath("/admin/publicatie");
    return {
      ok: true,
      message: publish ? "Foto gepubliceerd." : "Foto verborgen.",
    };
  });
}
