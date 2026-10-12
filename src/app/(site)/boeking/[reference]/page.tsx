import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { formatDateTime, formatDuration, formatPostcode, formatWindow, hasBookingStarted } from "@/lib/booking/format";
import { APPOINTMENT_STATUS_LABELS, FINAL_STATUSES, PAYMENT_STATUS_LABELS } from "@/lib/booking/labels";
import { isValidReference } from "@/lib/booking/routing";
import { bookingStatusSchema } from "@/lib/booking/schema";
import { cardClass } from "@/lib/booking/styles";
import { formatEuro } from "@/lib/money";
import { isMollieConfigured } from "@/lib/payments/mollie";
import { createClient } from "@/lib/supabase/server";
import { CancelBooking, PayButton } from "../_components/booking-actions";

// Shows one booking. Access is only granted with the token from the link.
export const instant = false;

export const metadata: Metadata = {
  title: "Je afspraak | 054repairs",
  robots: { index: false, follow: false },
};

type StatusPageProps = {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ t?: string | string[]; betaling?: string | string[] }>;
};

export default function BookingStatusPage(props: StatusPageProps) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6 md:py-10">
      <Suspense fallback={<StatusSkeleton />}>
        <BookingStatusView {...props} />
      </Suspense>
    </div>
  );
}

async function BookingStatusView({ params, searchParams }: StatusPageProps) {
  const { reference: rawReference } = await params;
  const query = await searchParams;
  const reference = rawReference.toUpperCase();
  const token = typeof query.t === "string" ? query.t.trim() : "";
  const paymentFailed = query.betaling === "mislukt";

  if (!isValidReference(reference) || token.length < 16) {
    return <InvalidLink />;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_booking_status", {
    p_reference: reference,
    p_token: token,
  });

  if (error) {
    return (
      <Card title="Je afspraak kan nu niet worden geladen">
        <p className="text-base text-navy-700">Probeer het later opnieuw.</p>
      </Card>
    );
  }

  // data is null when the reference and token do not match.
  const parsed = bookingStatusSchema.safeParse(data);

  if (!parsed.success) {
    return <InvalidLink />;
  }

  const booking = parsed.data;
  const paymentReady = await isMollieConfigured().catch(() => false);
  // Request time: the started check must not be prerendered.
  await connection();

  const isFinal = FINAL_STATUSES.includes(booking.status);
  const canCancel = !isFinal && !hasBookingStarted(booking.startsAt);
  const openDepositCents = Math.max(0, booking.depositCents - booking.paidCents);
  const restCents = Math.max(0, booking.totalCents - booking.depositCents);
  const canPay = !isFinal && booking.paymentStatus === "unpaid" && paymentReady && openDepositCents > 0;
  const repairSubtotal = booking.items.reduce((sum, item) => sum + item.priceCents, 0);
  const durationMinutes = Math.round((Date.parse(booking.endsAt) - Date.parse(booking.startsAt)) / 60_000);

  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm font-medium text-navy-600">Je afspraak</p>
        <h1 className="mt-1 break-all text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">
          {booking.reference}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>{APPOINTMENT_STATUS_LABELS[booking.status] ?? booking.status}</Badge>
          <Badge>{PAYMENT_STATUS_LABELS[booking.paymentStatus] ?? booking.paymentStatus}</Badge>
        </div>
      </header>

      {paymentFailed && (
        <Notice tone="warning">
          We konden de betaling nu niet starten. Je boeking is wel vastgelegd. Probeer het opnieuw met de knop hieronder.
        </Notice>
      )}

      {!paymentReady && !isFinal && (
        <Notice>Testmodus: betaling is nog niet actief, je boeking is wel vastgelegd.</Notice>
      )}

      {booking.status === "cancelled" && <Notice>Deze afspraak is geannuleerd.</Notice>}

      <Card title="Wanneer">
        <p className="text-base font-medium text-navy-950">{formatDateTime(booking.startsAt)}</p>
        <p className="mt-1 text-base text-navy-800">
          Tijdslot {formatWindow(booking.startsAt, booking.endsAt)} · {formatDuration(durationMinutes)}
        </p>
        <p className="mt-3 text-sm text-navy-600">
          Je krijgt je toestel terug zodra de reparatietijd voorbij is.
        </p>
      </Card>

      <Card title="Toestel en reparaties">
        <p className="break-words text-base font-medium text-navy-950">{booking.modelLabel}</p>
        <ul className="mt-3 space-y-3">
          {booking.items.map((item) => (
            <li key={item.repairTypeId} className="flex justify-between gap-4 text-base">
              <span className="min-w-0">
                <span className="block font-medium text-navy-950">{item.name}</span>
                <span className="block text-sm text-navy-600">
                  {item.qualityName} · {formatDuration(item.durationMinutes)}
                </span>
              </span>
              <span className="shrink-0 font-medium text-navy-950">{formatEuro(item.priceCents)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Adres">
        <p className="break-words text-base text-navy-950">
          {booking.street} {booking.houseNumber}
        </p>
        <p className="text-base text-navy-800">
          {formatPostcode(booking.postcode)} {booking.city}
        </p>
      </Card>

      <Card title="Bedragen">
        <dl className="space-y-2 text-base">
          <Row label="Reparaties" value={formatEuro(repairSubtotal)} />
          <Row label="Voorrijkosten" value={booking.travelFeeCents === 0 ? "Gratis" : formatEuro(booking.travelFeeCents)} />
          <div className="flex justify-between gap-4 border-t border-navy-100 pt-3 font-semibold text-navy-950">
            <dt>Totaal</dt>
            <dd>{formatEuro(booking.totalCents)}</dd>
          </div>
          <Row label="Betaald" value={formatEuro(booking.paidCents)} />
          <Row label="Aanbetaling" value={formatEuro(booking.depositCents)} />
          {openDepositCents > 0 && <Row label="Nog open (aanbetaling)" value={formatEuro(openDepositCents)} />}
          {restCents > 0 && <Row label="Rest bij oplevering" value={formatEuro(restCents)} />}
        </dl>
      </Card>

      {canPay && (
        <Card title="Betaling nog open">
          <p className="text-base text-navy-800">
            Betaal de aanbetaling van {formatEuro(openDepositCents)} om je afspraak te bevestigen.
          </p>
          <div className="mt-4">
            <PayButton reference={booking.reference} token={token} label={`Betaal ${formatEuro(openDepositCents)}`} />
          </div>
        </Card>
      )}

      {canCancel && (
        <Card title="Afspraak annuleren">
          <p className="text-base text-navy-800">Je kunt annuleren tot het begin van je afspraak.</p>
          <div className="mt-4">
            <CancelBooking reference={booking.reference} token={token} />
          </div>
        </Card>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={cardClass}>
      <h2 className="text-base font-semibold text-navy-950">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-navy-700">{label}</dt>
      <dd className="text-right font-medium text-navy-950">{value}</dd>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-navy-100 px-3 py-1 text-sm font-medium text-navy-900">{children}</span>
  );
}

function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warning" }) {
  const styles =
    tone === "warning"
      ? "bg-amber-50 text-amber-900 ring-amber-200"
      : "bg-navy-100/70 text-navy-900 ring-navy-200";

  return <p className={`rounded-2xl px-4 py-3 text-sm ring-1 ${styles}`}>{children}</p>;
}

function InvalidLink() {
  return (
    <Card title="Deze link klopt niet">
      <p className="text-base text-navy-700">
        Controleer of je de volledige link uit de bevestigingsmail gebruikt. Lukt het nog steeds niet? Neem dan contact met ons op.
      </p>
    </Card>
  );
}

function StatusSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className={cardClass}>
        <div className="h-7 w-1/2 rounded-lg bg-navy-100" />
        <div className="mt-3 h-4 w-1/3 rounded-lg bg-navy-100" />
      </div>
      <div className={cardClass}>
        <div className="h-4 w-2/3 rounded-lg bg-navy-100" />
        <div className="mt-3 h-4 w-1/2 rounded-lg bg-navy-100" />
      </div>
    </div>
  );
}
