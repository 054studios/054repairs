import "server-only";
import { sendEmail } from "@/lib/email/send";
import { formatEuro } from "@/lib/money";
import { getSiteUrl } from "./config";
import { formatDateTime } from "./format";
import { bookingStatusPath } from "./routing";
import type { PaymentChoice } from "./types";

type Confirmation = {
  to: string;
  customerName: string;
  reference: string;
  token: string;
  startsAt: string;
  totalCents: number;
  depositCents: number;
  paymentChoice: PaymentChoice;
  paymentPending: boolean;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Sends the confirmation. Never throws: a failing email must not fail the booking.
export async function sendBookingConfirmation(input: Confirmation): Promise<void> {
  try {
    const link = `${await getSiteUrl()}${bookingStatusPath(input.reference, input.token)}`;
    const when = formatDateTime(input.startsAt);
    const toPay = input.paymentChoice === "full" ? input.totalCents : input.depositCents;
    const payLine = input.paymentPending
      ? `Betaal ${formatEuro(toPay)} via de betaallink op je afsprakenpagina.`
      : `Je betaalt ${formatEuro(toPay)} nu. De rest betaal je met pin of contant bij het terugbrengen van je toestel.`;

    const text = [
      `Hoi ${input.customerName},`,
      "",
      `Je afspraak is vastgelegd. Referentie: ${input.reference}.`,
      `Wanneer: ${when}.`,
      payLine,
      "",
      `Bekijk of wijzig je afspraak: ${link}`,
    ].join("\n");

    const html = `<p>Hoi ${escapeHtml(input.customerName)},</p>
<p>Je afspraak is vastgelegd. Referentie: <strong>${escapeHtml(input.reference)}</strong>.</p>
<p>Wanneer: ${escapeHtml(when)}.</p>
<p>${escapeHtml(payLine)}</p>
<p><a href="${escapeHtml(link)}">Bekijk of wijzig je afspraak</a></p>`;

    await sendEmail({
      to: input.to,
      subject: `Bevestiging afspraak ${input.reference}`,
      text,
      html,
    });
  } catch {
    // Intentionally silent: the booking is already stored.
  }
}
