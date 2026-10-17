"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
const link = z.object({
  reference: z.string().regex(/^054-[A-F0-9]{8}$/),
  token: z.string().min(16).max(200),
});
export async function getRescheduleSlots(
  reference: string,
  token: string,
  day: string,
): Promise<{ ok: true; slots: string[] } | { ok: false; message: string }> {
  if (
    !link.safeParse({ reference, token }).success ||
    !z.iso.date().safeParse(day).success
  )
    return { ok: false, message: "Controleer de link en de gekozen datum." };
  const db = await createClient();
  const { data, error } = await db.rpc("reschedule_slots", {
    p_reference: reference,
    p_token: token,
    p_day: day,
  });
  const parsed = z.array(z.object({ slot_start: z.string() })).safeParse(data);
  if (error || !parsed.success)
    return {
      ok: false,
      message:
        "Verzetten is momenteel niet beschikbaar. Neem contact met ons op.",
    };
  return { ok: true, slots: parsed.data.map((s) => s.slot_start) };
}
export async function reschedule(
  reference: string,
  token: string,
  start: string,
) {
  if (
    !link.safeParse({ reference, token }).success ||
    !z.iso.datetime({ offset: true }).safeParse(start).success
  )
    return { ok: false, message: "Controleer de link en gekozen tijd." };
  const db = await createClient();
  const { error } = await db.rpc("reschedule_booking", {
    p_reference: reference,
    p_token: token,
    p_start: start,
  });
  if (error)
    return {
      ok: false,
      message:
        "Dit moment is niet meer beschikbaar of de termijn om te verzetten is verstreken.",
    };
  revalidatePath("/boeking/" + reference);
  revalidatePath("/admin/afspraken");
  revalidatePath("/admin/werkdag");
  return {
    ok: true,
    message:
      "Je afspraak is verzet. Het nieuwe moment staat op deze pagina. Bewaar je bestaande statuslink.",
  };
}
