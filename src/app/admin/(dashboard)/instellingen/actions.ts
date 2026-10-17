"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createMollieClient } from "@mollie/api-client";
import { requireAdmin } from "@/lib/auth";
import { safely, savedResult, type ActionResult } from "@/lib/action-result";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const PATH = "/admin/instellingen";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function saveBusinessSettings(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return safely(async () => {
    const { supabase } = await requireAdmin();

    const name = text(formData, "business_name");
    if (!name) throw new Error("Vul de bedrijfsnaam in.");

    const { error } = await supabase
      .from("settings")
      .update({
        business_name: name,
        phone: text(formData, "phone") || null,
        email: text(formData, "email") || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) throw new Error("Opslaan is mislukt.");

    updateTag("public-settings");
    revalidatePath(PATH);
    return savedResult;
  });
}

// Stores the Mollie API key encrypted. Only the server can read the table, so the
// key never reaches the browser after it has been saved.
export async function saveMollieKey(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return safely(async () => {
    await requireAdmin();

    const key = text(formData, "mollie_api_key");

    if (key === "") {
      return { ok: true, message: "Geen nieuwe key ingevuld. De huidige key blijft staan." };
    }

    if (!/^(test|live)_[A-Za-z0-9]{10,}$/.test(key)) {
      throw new Error("Dit lijkt geen Mollie API-key. Een key begint met test_ of live_.");
    }

    const mode = key.startsWith("live_") ? "live" : "test";
    const admin = createAdminClient();
    const now = new Date().toISOString();

    const { error: secretError } = await admin.from("payment_secrets").upsert({
      id: 1,
      mollie_api_key_ciphertext: encryptSecret(key),
      mollie_api_key_hint: key.slice(-4),
      updated_at: now,
    });

    if (secretError) throw new Error("Opslaan van de key is mislukt.");

    const { error: settingsError } = await admin
      .from("settings")
      .update({ mollie_mode: mode, updated_at: now })
      .eq("id", 1);

    if (settingsError) throw new Error("De modus kon niet worden bijgewerkt.");

    updateTag("public-settings");
    revalidatePath(PATH);
    return { ok: true, message: `Mollie-key opgeslagen (${mode === "live" ? "live" : "test"}-modus).` };
  });
}

export async function testMollieKey(): Promise<ActionResult> {
  return safely(async () => {
    await requireAdmin();

    const admin = createAdminClient();
    const { data: secret } = await admin
      .from("payment_secrets")
      .select("mollie_api_key_ciphertext")
      .eq("id", 1)
      .single();

    if (!secret?.mollie_api_key_ciphertext) {
      throw new Error("Er is nog geen Mollie-key opgeslagen.");
    }

    const mollie = createMollieClient({ apiKey: decryptSecret(secret.mollie_api_key_ciphertext) });

    try {
      await mollie.methods.list();
    } catch {
      throw new Error("Mollie heeft de key niet geaccepteerd. Controleer de key in je Mollie-dashboard.");
    }

    return { ok: true, message: "Verbinding met Mollie werkt." };
  });
}
