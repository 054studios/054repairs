"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { safely, savedResult, type ActionResult } from "@/lib/action-result";
import { getSiteUrl } from "@/lib/booking/config";
import { bookingThanksPath } from "@/lib/booking/routing";
import { formatEuro, parseEuroToCents } from "@/lib/money";
import { paymentStatusFor, readPaidSnapshot, swapPaidFields } from "@/lib/payments/ledger";
import { createMolliePaymentForAppointment, isMollieConfigured } from "@/lib/payments/mollie";
import {
  ADMIN_STATUSES,
  CANCEL_REASON,
  isInactive,
  outstandingCents,
  type MollieLinkResult,
} from "./shared";

const LIST_PATH = "/admin/afspraken";
const GENERIC_ERROR = "Er ging iets mis. Probeer het opnieuw.";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function appointmentKey(id: string): string {
  if (!UUID.test(id)) {
    throw new Error("Afspraak niet gevonden.");
  }

  return id;
}

// 23P01 = exclusion constraint: another active appointment already holds this time slot.
function dbError(error: { code?: string }): Error {
  if (error.code === "23P01") {
    return new Error("Dit tijdslot is intussen door een andere afspraak bezet.");
  }

  return new Error("Opslaan is mislukt. Probeer het opnieuw.");
}

function refreshPages(id: string) {
  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${id}`);
  revalidatePath("/admin");
}

// Sets any admin-visible status. Cancelling records the time and the standard reason.
export async function updateAppointmentStatus(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  return safely(async () => {
    const key = appointmentKey(id);

    const next = text(formData, "status");
    if (!(ADMIN_STATUSES as readonly string[]).includes(next)) {
      throw new Error("Kies een geldige status.");
    }

    const { data: current, error: readError } = await supabase
      .from("appointments")
      .select("status")
      .eq("id", key)
      .maybeSingle();

    if (readError) throw new Error("De afspraak kon niet worden geladen.");
    if (!current) throw new Error("Afspraak niet gevonden.");
    if (current.status === "expired") throw new Error("Een verlopen afspraak kun je niet meer wijzigen.");
    if (current.status === next) return { ok: true, message: "De status stond al zo." };

    const now = new Date().toISOString();
    const patch: Record<string, string | null> = { status: next, updated_at: now };

    if (next === "cancelled") {
      patch.cancelled_at = now;
      patch.cancel_reason = CANCEL_REASON;
    } else if (current.status === "cancelled") {
      // Reopening an appointment clears the cancellation.
      patch.cancelled_at = null;
      patch.cancel_reason = null;
    }

    const { error } = await supabase.from("appointments").update(patch).eq("id", key);
    if (error) throw dbError(error);

    refreshPages(key);
    return savedResult;
  });
}

// Cancels the appointment and frees its time slot. Refunds are not automatic: the admin handles them.
export async function cancelAppointment(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  return safely(async () => {
    const key = appointmentKey(id);

    const { data: current, error: readError } = await supabase
      .from("appointments")
      .select("status")
      .eq("id", key)
      .maybeSingle();

    if (readError) throw new Error("De afspraak kon niet worden geladen.");
    if (!current) throw new Error("Afspraak niet gevonden.");
    if (current.status === "cancelled") throw new Error("Deze afspraak is al geannuleerd.");
    if (current.status === "expired") throw new Error("Deze afspraak is verlopen en heeft geen tijdslot meer.");

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled", cancelled_at: now, cancel_reason: CANCEL_REASON, updated_at: now })
      .eq("id", key)
      .neq("status", "cancelled");

    if (error) throw dbError(error);

    refreshPages(key);
    return { ok: true, message: "Afspraak geannuleerd. Een eventuele terugbetaling regel je zelf." };
  });
}

// Records a pin or cash payment for the open amount. The amount can never exceed what is still owed.
export async function recordBalancePayment(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  return safely(async () => {
    const key = appointmentKey(id);

    const method = text(formData, "method");
    if (method !== "pin" && method !== "cash") {
      throw new Error("Kies pin of contant.");
    }

    const amountCents = parseEuroToCents(text(formData, "amount"));
    if (amountCents === null || amountCents <= 0) {
      throw new Error("Vul een bedrag in dat hoger is dan nul.");
    }

    // Read again here, so the check uses the current state and not the page the admin saw.
    const current = await readPaidSnapshot(supabase, key);
    if (!current) throw new Error("Afspraak niet gevonden.");
    if (isInactive(current.status)) {
      throw new Error("Op een geannuleerde afspraak kun je geen betaling registreren.");
    }

    const outstanding = outstandingCents(current.totalCents, current.paidCents);
    if (outstanding <= 0) throw new Error("Deze afspraak is al volledig betaald.");
    if (amountCents > outstanding) {
      throw new Error(`Het bedrag mag niet hoger zijn dan het openstaande bedrag van ${formatEuro(outstanding)}.`);
    }

    const paidCents = current.paidCents + amountCents;
    const previous = {
      paidCents: current.paidCents,
      paymentStatus: current.paymentStatus,
      balanceMethod: current.balanceMethod,
    };
    const next = {
      paidCents,
      paymentStatus: paymentStatusFor(paidCents, current.totalCents, current.paymentStatus),
      balanceMethod: method,
    };

    // Step 1: move the appointment totals (optimistic lock). Step 2: store the payment row.
    const applied = await swapPaidFields(supabase, key, current.paidCents, next, { clearHold: false });
    if (!applied) throw new Error("De betaling is intussen veranderd. Laad de pagina opnieuw.");

    const { error } = await supabase.from("payments").insert({
      appointment_id: key,
      kind: "balance",
      amount_cents: amountCents,
      method,
      provider: method,
      status: "paid",
      paid_at: new Date().toISOString(),
    });

    if (error) {
      // Undo step 1, so the totals match the payment history again.
      await swapPaidFields(supabase, key, paidCents, previous, { clearHold: false });
      throw new Error("De betaling kon niet worden opgeslagen. Probeer het opnieuw.");
    }

    refreshPages(key);
    const label = method === "pin" ? "pin" : "contant";
    return { ok: true, message: `${formatEuro(amountCents)} als ${label} betaald geregistreerd.` };
  });
}

// Creates a Mollie link for the open amount. Only used when Mollie is configured.
export async function createBalancePaymentLink(id: string): Promise<MollieLinkResult> {
  // Outside the try block: requireAdmin() ends the request with redirect or notFound, which must not be caught.
  const { supabase } = await requireAdmin();

  try {
    const key = appointmentKey(id);

    if (!(await isMollieConfigured())) {
      return { ok: false, message: "Mollie is nog niet ingesteld" };
    }

    const { data: appointment, error } = await supabase
      .from("appointments")
      .select("reference, status, total_cents, paid_cents")
      .eq("id", key)
      .maybeSingle();

    if (error) throw new Error("De afspraak kon niet worden geladen.");
    if (!appointment) throw new Error("Afspraak niet gevonden.");
    if (isInactive(appointment.status)) {
      throw new Error("Voor een geannuleerde afspraak kun je geen betaallink maken.");
    }

    const outstanding = outstandingCents(appointment.total_cents, appointment.paid_cents);
    if (outstanding <= 0) throw new Error("Deze afspraak is al volledig betaald.");

    const siteUrl = await getSiteUrl();
    const payment = await createMolliePaymentForAppointment({
      appointmentId: key,
      reference: appointment.reference,
      amountCents: outstanding,
      kind: "balance",
      description: `054repairs restbedrag ${appointment.reference}`,
      redirectUrl: `${siteUrl}${bookingThanksPath(appointment.reference)}`,
    });

    revalidatePath(`${LIST_PATH}/${key}`);

    return {
      ok: true,
      message: `Betaallink voor ${formatEuro(outstanding)} gemaakt.`,
      checkoutUrl: payment.checkoutUrl,
    };
  } catch (cause) {
    return {
      ok: false,
      message: cause instanceof Error ? cause.message : GENERIC_ERROR,
    };
  }
}
