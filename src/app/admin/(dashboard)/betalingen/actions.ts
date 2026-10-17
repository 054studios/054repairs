"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { safely, savedResult, type ActionResult } from "@/lib/action-result";
import { parseEuroToCents } from "@/lib/money";

const PATH = "/admin/betalingen";

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

export async function savePaymentSettings(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return safely(async () => {
    const { supabase } = await requireAdmin();

    const type = text(formData, "deposit_type");
    if (type !== "fixed" && type !== "percent") {
      throw new Error("Kies een vast bedrag of een percentage.");
    }

    // Fixed amounts are stored in cents, percentages as whole numbers.
    let depositValue: number;
    if (type === "fixed") {
      const cents = parseEuroToCents(text(formData, "deposit_value"));
      if (cents === null) throw new Error("Vul het bedrag van de aanbetaling in.");
      depositValue = cents;
    } else {
      depositValue = whole(formData, "deposit_value", "Het percentage", 0, 100);
    }

    const { error } = await supabase
      .from("settings")
      .update({
        deposit_type: type,
        deposit_value: depositValue,
        allow_full_prepay: formData.get("allow_full_prepay") === "on",
        full_refund_hours: whole(formData, "full_refund_hours", "De termijn voor volledige restitutie", 0, 24 * 30),
        late_cancel_refund_percent: whole(formData, "late_cancel_refund_percent", "Het restitutiepercentage", 0, 100),
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) throw new Error("Opslaan is mislukt.");

    updateTag("public-settings");
    revalidatePath(PATH);
    return savedResult;
  });
}
