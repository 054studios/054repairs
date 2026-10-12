import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Keeps appointments.paid_cents, payment_status and balance_method in step with the payments table.
// Writes use an optimistic lock on paid_cents, so two payments at the same moment never overwrite each other.

export type BalanceMethod = "pin" | "cash" | "mollie";

export type PaidSnapshot = {
  status: string;
  totalCents: number;
  paidCents: number;
  paymentStatus: string;
  balanceMethod: string | null;
};

export async function readPaidSnapshot(
  client: SupabaseClient,
  appointmentId: string,
): Promise<PaidSnapshot | null> {
  const { data, error } = await client
    .from("appointments")
    .select("status, total_cents, paid_cents, payment_status, balance_method")
    .eq("id", appointmentId)
    .maybeSingle();

  if (error) {
    throw new Error("De afspraak kon niet worden geladen.");
  }

  if (!data) {
    return null;
  }

  return {
    status: data.status,
    totalCents: data.total_cents,
    paidCents: data.paid_cents,
    paymentStatus: data.payment_status,
    balanceMethod: data.balance_method,
  };
}

// Payment status after `paidCents` has been received. A refund status is never overwritten.
export function paymentStatusFor(paidCents: number, totalCents: number, current: string): string {
  if (current === "refunded") {
    return "refunded";
  }

  return paidCents >= totalCents ? "paid" : "deposit_paid";
}

type PaidFields = {
  paidCents: number;
  paymentStatus: string;
  balanceMethod: string | null;
};

// Writes `next` only when paid_cents still equals `expectedPaidCents`. Returns false on a conflict.
export async function swapPaidFields(
  client: SupabaseClient,
  appointmentId: string,
  expectedPaidCents: number,
  next: PaidFields,
  options: { clearHold: boolean },
): Promise<boolean> {
  const patch: Record<string, unknown> = {
    paid_cents: next.paidCents,
    payment_status: next.paymentStatus,
    balance_method: next.balanceMethod,
    updated_at: new Date().toISOString(),
  };

  if (options.clearHold) {
    patch.hold_expires_at = null;
  }

  const { data, error } = await client
    .from("appointments")
    .update(patch)
    .eq("id", appointmentId)
    .eq("paid_cents", expectedPaidCents)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error("De betaling kon niet worden opgeslagen.");
  }

  return data !== null;
}

// Adds a received amount to an appointment. Retries when another write changed paid_cents in between.
export async function addPaymentToAppointment(
  client: SupabaseClient,
  appointmentId: string,
  amountCents: number,
  balanceMethod: BalanceMethod | null,
): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const current = await readPaidSnapshot(client, appointmentId);

    if (!current) {
      throw new Error("Afspraak niet gevonden.");
    }

    const paidCents = current.paidCents + amountCents;
    const applied = await swapPaidFields(
      client,
      appointmentId,
      current.paidCents,
      {
        paidCents,
        paymentStatus: paymentStatusFor(paidCents, current.totalCents, current.paymentStatus),
        balanceMethod: balanceMethod ?? current.balanceMethod,
      },
      { clearHold: true },
    );

    if (applied) {
      return;
    }
  }

  throw new Error("Betaling kon niet worden verwerkt. Probeer het opnieuw.");
}
