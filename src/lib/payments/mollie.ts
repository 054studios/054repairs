import "server-only";
import { createMollieClient } from "@mollie/api-client";
import { decryptSecret } from "@/lib/crypto";
import { getServerEnv } from "@/lib/env.server";
import { createAdminClient } from "@/lib/supabase/admin";

// Mollie stays dormant until the owner stores an API key (encrypted) and the server secrets are set.
// Every caller checks isMollieConfigured() first, so the shop works without Mollie.

export type MollieKind = "deposit" | "full" | "balance";

const NOT_CONFIGURED = "Betalen is nog niet ingesteld";

export async function isMollieConfigured(): Promise<boolean> {
  if (!getServerEnv()) {
    return false;
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("payment_secrets")
      .select("mollie_api_key_ciphertext")
      .eq("id", 1)
      .maybeSingle();

    return !error && Boolean(data?.mollie_api_key_ciphertext);
  } catch {
    return false;
  }
}

export async function getMollieClient() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payment_secrets")
    .select("mollie_api_key_ciphertext")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new Error("De betaalinstellingen konden niet worden geladen.");
  }

  if (!data?.mollie_api_key_ciphertext) {
    throw new Error(NOT_CONFIGURED);
  }

  let apiKey: string;

  try {
    apiKey = decryptSecret(data.mollie_api_key_ciphertext);
  } catch {
    throw new Error("De Mollie-sleutel kan niet worden gelezen. Controleer APP_ENCRYPTION_KEY.");
  }

  return createMollieClient({ apiKey });
}

async function findAppointmentIdByReference(reference: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("appointments")
    .select("id")
    .eq("reference", reference)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Afspraak niet gevonden.");
  }

  return data.id;
}

// Creates a payment at Mollie and returns the checkout link.
// The row in payments is written first (status open), so the webhook can always find it.
// appointmentId is optional: without it the appointment is looked up by reference.
export async function createMolliePaymentForAppointment(input: {
  appointmentId?: string;
  reference: string;
  amountCents: number;
  kind: MollieKind;
  description: string;
  redirectUrl: string;
}): Promise<{ checkoutUrl: string; paymentId: string }> {
  if (!(await isMollieConfigured())) {
    throw new Error(NOT_CONFIGURED);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");

  if (!siteUrl) {
    throw new Error("De websitelink ontbreekt. Stel NEXT_PUBLIC_SITE_URL in.");
  }

  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error("Het bedrag voor de betaling is ongeldig.");
  }

  const appointmentId = input.appointmentId ?? (await findAppointmentIdByReference(input.reference));
  const admin = createAdminClient();

  const { data: row, error: insertError } = await admin
    .from("payments")
    .insert({
      appointment_id: appointmentId,
      kind: input.kind,
      amount_cents: input.amountCents,
      provider: "mollie",
      status: "open",
    })
    .select("id")
    .single();

  if (insertError || !row) {
    throw new Error("De betaling kon niet worden voorbereid.");
  }

  let created: { id: string; checkoutUrl: string | null };

  try {
    const mollie = await getMollieClient();
    const payment = await mollie.payments.create({
      amount: { currency: "EUR", value: (input.amountCents / 100).toFixed(2) },
      description: input.description,
      redirectUrl: input.redirectUrl,
      webhookUrl: `${siteUrl}/api/mollie/webhook`,
      metadata: { paymentId: row.id, reference: input.reference },
    });

    created = { id: payment.id, checkoutUrl: payment.getCheckoutUrl() };
  } catch (cause) {
    console.error("Mollie-betaling aanmaken mislukt", cause);
    await admin.from("payments").update({ status: "failed" }).eq("id", row.id);

    if (cause instanceof Error && cause.message === NOT_CONFIGURED) {
      throw cause;
    }

    throw new Error("Betaallink kon niet worden gemaakt. Probeer het later opnieuw.");
  }

  if (!created.checkoutUrl) {
    await admin.from("payments").update({ status: "failed" }).eq("id", row.id);
    throw new Error("Betaallink kon niet worden gemaakt. Probeer het later opnieuw.");
  }

  const { error: linkError } = await admin
    .from("payments")
    .update({ provider_payment_id: created.id })
    .eq("id", row.id);

  if (linkError) {
    throw new Error("Betaallink kon niet worden gemaakt. Probeer het later opnieuw.");
  }

  return { checkoutUrl: created.checkoutUrl, paymentId: created.id };
}
