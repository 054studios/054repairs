"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { safely, savedResult, type ActionResult } from "@/lib/action-result";
import { amsterdamLocalToIso } from "@/lib/time";

const PATH = "/admin/planning";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function whole(formData: FormData, key: string, label: string, min: number, max: number): number {
  const value = Number(text(formData, key));

  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${label} moet tussen ${min} en ${max} liggen.`);
  }

  return value;
}

function time(formData: FormData, key: string, label: string): string {
  const value = text(formData, key);

  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new Error(`Vul een geldige tijd in voor ${label}.`);
  }

  return value;
}

function workHourFields(formData: FormData) {
  const opens = time(formData, "opens_at", "openen");
  const closes = time(formData, "closes_at", "sluiten");

  if (closes <= opens) {
    throw new Error("Het sluitingstijdstip moet na het openingstijdstip liggen.");
  }

  return {
    weekday: whole(formData, "weekday", "De dag", 0, 6),
    opens_at: opens,
    closes_at: closes,
  };
}

export async function saveSlotSettings(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return safely(async () => {
    const { supabase } = await requireAdmin();

    const { error } = await supabase
      .from("settings")
      .update({
        slot_step_minutes: whole(formData, "slot_step_minutes", "De startinterval", 5, 120),
        booking_lead_hours: whole(formData, "booking_lead_hours", "De minimale vooruitboektijd", 0, 24 * 60),
        max_appointments_per_day: whole(formData, "max_appointments_per_day", "Maximaal aantal afspraken per dag", 1, 50),
        travel_buffer_minutes: whole(formData, "travel_buffer_minutes", "De reistijd tussen afspraken", 0, 240),
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) throw new Error("Opslaan is mislukt.");

    updateTag("public-settings");
    revalidatePath(PATH);
    return savedResult;
  });
}

export async function addWorkHour(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return safely(async () => {
    const { supabase } = await requireAdmin();

    const { error } = await supabase.from("work_hours").insert({ ...workHourFields(formData), active: true });
    if (error) throw new Error("Opslaan is mislukt.");

    updateTag("public-settings");
    revalidatePath(PATH);
    return savedResult;
  });
}

export async function updateWorkHour(id: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return safely(async () => {
    const { supabase } = await requireAdmin();

    const { error } = await supabase
      .from("work_hours")
      .update({ ...workHourFields(formData), active: formData.get("active") === "on" })
      .eq("id", id);

    if (error) throw new Error("Opslaan is mislukt.");

    updateTag("public-settings");
    revalidatePath(PATH);
    return savedResult;
  });
}

export async function deleteWorkHour(id: string): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("work_hours").delete().eq("id", id);
  updateTag("public-settings");
    revalidatePath(PATH);
}

export async function addBlockedPeriod(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return safely(async () => {
    const { supabase } = await requireAdmin();

    const startsAt = amsterdamLocalToIso(text(formData, "starts_at"));
    const endsAt = amsterdamLocalToIso(text(formData, "ends_at"));

    if (new Date(endsAt) <= new Date(startsAt)) {
      throw new Error("Het einde moet na het begin liggen.");
    }

    const { error } = await supabase.from("blocked_periods").insert({
      starts_at: startsAt,
      ends_at: endsAt,
      reason: text(formData, "reason") || null,
    });

    if (error) throw new Error("Opslaan is mislukt.");

    updateTag("public-settings");
    revalidatePath(PATH);
    return savedResult;
  });
}

export async function deleteBlockedPeriod(id: string): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("blocked_periods").delete().eq("id", id);
  updateTag("public-settings");
    revalidatePath(PATH);
}
