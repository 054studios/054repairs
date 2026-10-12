import type { SupabaseClient } from "@supabase/supabase-js";
import { addPaymentToAppointment } from "@/lib/payments/ledger";
import { getMollieClient, isMollieConfigured } from "@/lib/payments/mollie";
import { createAdminClient } from "@/lib/supabase/admin";

// Mollie calls this URL with a form body that holds only the payment id (tr_...).
// The payment is fetched again with our own key, so the body itself is never trusted.
// Mollie retries on anything but a 2xx, so errors only ever return a bare 500.

const PAYMENT_ID = /^tr_[A-Za-z0-9]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Our payments.status values for Mollie statuses.
const LOCAL_STATUS: Record<string, string> = {
  open: "open",
  pending: "pending",
  authorized: "pending",
  paid: "paid",
  failed: "failed",
  expired: "expired",
  canceled: "canceled",
};

type PaymentRow = {
  id: string;
  appointment_id: string;
  amount_cents: number;
  kind: string;
  status: string;
};

const ROW_COLUMNS = "id, appointment_id, amount_cents, kind, status";

function empty(status: number): Response {
  return new Response(null, { status });
}

async function findPaymentRow(
  admin: SupabaseClient,
  providerPaymentId: string,
  metadata: unknown,
): Promise<PaymentRow | null> {
  const { data } = await admin
    .from("payments")
    .select(ROW_COLUMNS)
    .eq("provider_payment_id", providerPaymentId)
    .maybeSingle();

  if (data) {
    return data as PaymentRow;
  }

  // Fallback: the row id travels in the Mollie metadata. Covers a failed link update after creation.
  const paymentId =
    metadata && typeof metadata === "object" && "paymentId" in metadata
      ? (metadata as { paymentId?: unknown }).paymentId
      : undefined;

  if (typeof paymentId !== "string" || !UUID.test(paymentId)) {
    return null;
  }

  const { data: byMetadata } = await admin
    .from("payments")
    .select(ROW_COLUMNS)
    .eq("id", paymentId)
    .eq("provider", "mollie")
    .is("provider_payment_id", null)
    .maybeSingle();

  if (!byMetadata) {
    return null;
  }

  await admin.from("payments").update({ provider_payment_id: providerPaymentId }).eq("id", paymentId);
  return byMetadata as PaymentRow;
}

async function applyMollieStatus(
  admin: SupabaseClient,
  row: PaymentRow,
  mollieStatus: string,
  paidAt: string | undefined,
): Promise<void> {
  // Already processed: a repeated webhook must never add the amount twice.
  if (row.status === "paid") {
    return;
  }

  if (mollieStatus !== "paid") {
    const { error } = await admin
      .from("payments")
      .update({ status: LOCAL_STATUS[mollieStatus] ?? "pending" })
      .eq("id", row.id)
      .neq("status", "paid");

    if (error) {
      throw error;
    }

    return;
  }

  // Claim the transition first. Only the request that flips the row to paid adds the amount.
  const { data: claimed, error } = await admin
    .from("payments")
    .update({ status: "paid", paid_at: paidAt ?? new Date().toISOString() })
    .eq("id", row.id)
    .neq("status", "paid")
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!claimed) {
    return;
  }

  try {
    await addPaymentToAppointment(admin, row.appointment_id, row.amount_cents, row.kind === "balance" ? "mollie" : null);
  } catch (cause) {
    // Undo the claim, so the retry from Mollie can apply the amount.
    await admin.from("payments").update({ status: row.status, paid_at: null }).eq("id", row.id).eq("status", "paid");
    throw cause;
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    if (!(await isMollieConfigured())) {
      return empty(503);
    }

    const form = await request.formData();
    const id = form.get("id");

    if (typeof id !== "string" || !PAYMENT_ID.test(id)) {
      return empty(400);
    }

    const mollie = await getMollieClient();
    const payment = await mollie.payments.get(id);
    const admin = createAdminClient();

    const row = await findPaymentRow(admin, id, payment.metadata);

    if (!row) {
      // Not found yet. A 500 makes Mollie retry, which covers a payment that is still being saved.
      return empty(500);
    }

    await applyMollieStatus(admin, row, String(payment.status), payment.paidAt);
    return empty(200);
  } catch (cause) {
    console.error("Mollie-webhook mislukt", cause);
    return empty(500);
  }
}
