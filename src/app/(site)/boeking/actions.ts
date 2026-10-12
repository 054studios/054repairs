"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { type ActionResult, safely } from "@/lib/action-result";
import { getSiteUrl } from "@/lib/booking/config";
import { bookingStatusPath, isValidReference } from "@/lib/booking/routing";
import { bookingStatusSchema } from "@/lib/booking/schema";
import { createMolliePaymentForAppointment, isMollieConfigured } from "@/lib/payments/mollie";
import { createClient } from "@/lib/supabase/server";

const linkSchema = z.object({
  reference: z.string().transform((value) => value.toUpperCase()).refine((value) => isValidReference(value)),
  token: z.string().min(16).max(200),
});

const LINK_INVALID = "Deze link klopt niet.";
const PAYMENT_UNAVAILABLE = "De betaling kan nu niet worden gestart. Probeer het later opnieuw.";

// Cancels the appointment. Allowed until the start, enforced in the database.
export async function cancelBookingAction(reference: string, token: string): Promise<ActionResult> {
  const input = linkSchema.safeParse({ reference, token });

  if (!input.success) {
    return { ok: false, message: LINK_INVALID };
  }

  return safely(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("cancel_booking", {
      p_reference: input.data.reference,
      p_token: input.data.token,
    });

    if (error) {
      // P0001 = a RAISE EXCEPTION in the database, whose message is already Dutch.
      return {
        ok: false,
        message: error.code === "P0001" ? error.message : "Annuleren lukt nu niet. Probeer het later opnieuw.",
      };
    }

    const paid = z.object({ paidCents: z.number() }).safeParse(data);
    const paidCents = paid.success ? paid.data.paidCents : 0;

    return {
      ok: true,
      message:
        paidCents > 0
          ? "Je afspraak is geannuleerd. Omdat je al hebt betaald, nemen wij contact met je op over de terugbetaling."
          : "Je afspraak is geannuleerd.",
    };
  });
}

// Starts a Mollie payment for the amount still open on the deposit, then sends the customer to Mollie.
export async function createPaymentLinkAction(reference: string, token: string): Promise<ActionResult> {
  const input = linkSchema.safeParse({ reference, token });

  if (!input.success) {
    return { ok: false, message: LINK_INVALID };
  }

  let target: string | null = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_booking_status", {
      p_reference: input.data.reference,
      p_token: input.data.token,
    });

    if (error) {
      return { ok: false, message: PAYMENT_UNAVAILABLE };
    }

    const parsed = bookingStatusSchema.safeParse(data);

    if (!parsed.success) {
      return { ok: false, message: LINK_INVALID };
    }

    const booking = parsed.data;
    const openCents = booking.depositCents - booking.paidCents;

    if (booking.paymentStatus !== "unpaid" || booking.status === "cancelled" || booking.status === "expired" || openCents <= 0) {
      return { ok: false, message: "Voor deze afspraak is nu geen betaling nodig." };
    }

    const paymentReady = await isMollieConfigured().catch(() => false);

    if (!paymentReady) {
      return { ok: false, message: "Betalen is nog niet actief." };
    }

    const siteUrl = await getSiteUrl();
    const payment = await createMolliePaymentForAppointment({
      reference: booking.reference,
      amountCents: openCents,
      kind: booking.paymentChoice,
      description: `054repairs reparatie ${booking.reference}`,
      redirectUrl: `${siteUrl}${bookingStatusPath(booking.reference, input.data.token)}`,
    });

    target = payment.checkoutUrl;
  } catch (error) {
    console.error(error);
    return { ok: false, message: PAYMENT_UNAVAILABLE };
  }

  if (!target) {
    return { ok: false, message: PAYMENT_UNAVAILABLE };
  }

  // Outside the try block: redirect() works by throwing.
  redirect(target);
}
