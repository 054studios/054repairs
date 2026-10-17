"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { safely, savedResult, type ActionResult } from "@/lib/action-result";
import { geocodeAddress } from "@/lib/geocode";
import { parseEuroToCents } from "@/lib/money";

const PATH = "/admin/voorrijkosten";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function decimal(formData: FormData, key: string, label: string, min = 0): number {
  const value = Number(text(formData, key).replace(",", "."));

  if (!Number.isFinite(value) || value < min) {
    throw new Error(`${label} moet een getal van ${min} of hoger zijn.`);
  }

  return value;
}

export async function saveTravelSettings(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return safely(async () => {
    const { supabase } = await requireAdmin();

    const startAddress = text(formData, "start_address");
    const freeKm = decimal(formData, "free_travel_km", "De gratis kilometers");
    const maxKm = decimal(formData, "max_travel_km", "De maximale afstand", 1);
    const pricePerKm = parseEuroToCents(text(formData, "price_per_km"));
    const mode = text(formData, "travel_distance_mode");

    if (pricePerKm === null) {
      throw new Error("Vul de prijs per kilometer in.");
    }

    if (maxKm <= freeKm) {
      throw new Error("De maximale afstand moet groter zijn dan de gratis kilometers.");
    }

    if (mode !== "round_trip" && mode !== "one_way") {
      throw new Error("Kies enkele reis of heen en terug.");
    }

    const { data: current } = await supabase
      .from("settings")
      .select("start_address")
      .eq("id", 1)
      .single();

    const update: Record<string, unknown> = {
      start_address: startAddress,
      free_travel_km: freeKm,
      max_travel_km: maxKm,
      price_per_km_cents: pricePerKm,
      travel_distance_mode: mode,
      updated_at: new Date().toISOString(),
    };

    // Only look up coordinates when the address changed, to keep PDOK calls minimal.
    if (startAddress && startAddress !== current?.start_address) {
      const place = await geocodeAddress(startAddress);

      if (!place) {
        throw new Error("Dit startadres is niet gevonden. Probeer een volledig adres, bijvoorbeeld Dam 1, Amsterdam.");
      }

      update.start_address = place.label;
      update.start_lat = place.lat;
      update.start_lng = place.lng;
    }

    const { error } = await supabase.from("settings").update(update).eq("id", 1);

    if (error) throw new Error("Opslaan is mislukt.");

    updateTag("public-settings");
    revalidatePath(PATH);
    return savedResult;
  });
}
