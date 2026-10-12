import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { CalendarBlankIcon, DeviceMobileIcon, MapPinIcon } from "@phosphor-icons/react/dist/ssr";
import {
  amsterdamDay,
  formatClock,
  formatDayLong,
  formatDuration,
  formatPostcode,
  hasBookingStarted,
} from "@/lib/booking/format";
import {
  APPOINTMENT_STATUS_HEADLINES,
  FINAL_STATUSES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
} from "@/lib/booking/labels";
import { isValidReference } from "@/lib/booking/routing";
import { bookingStatusSchema } from "@/lib/booking/schema";
import { chipClass, panelTitleClass, skeletonClass, stepPanelClass } from "@/lib/booking/styles";
import { formatEuro } from "@/lib/money";
import { isMollieConfigured } from "@/lib/payments/mollie";
import { createClient } from "@/lib/supabase/server";
import { Notice } from "../../boeken/_components/notice";
import { AmountRow, Receipt } from "../../boeken/_components/receipt";
import { CancelBooking, PayButton } from "../_components/booking-actions";
import { StatusRoute } from "../_components/status-route";

// Shows one booking. Access is only granted with the token from the link.
export const instant = false;

export const metadata: Metadata = {
  // The (site) layout adds " | 054repairs".
  title: "Je afspraak",
  robots: { index: false, follow: false },
};

type StatusPageProps = {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ t?: string | string[]; betaling?: string | string[] }>;
};

const headingClass =
  "font-display text-[clamp(1.875rem,6.8vw,2.75rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-steel-50";

export default function BookingStatusPage(props: StatusPageProps) {
  return (
    <div className="mx-auto w-full max-w-[40rem] px-4 pb-16 pt-8 md:pb-24 md:pt-14">
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
      <Message title="Je afspraak kan nu niet worden geladen">
        Je boeking blijft gewoon staan. Probeer het over een paar minuten opnieuw met dezelfde link.
      </Message>
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
  const offRoute = booking.status === "cancelled" || booking.status === "expired";
  const canCancel = !isFinal && !hasBookingStarted(booking.startsAt);
  const openDepositCents = Math.max(0, booking.depositCents - booking.paidCents);
  const restCents = Math.max(0, booking.totalCents - booking.depositCents);
  const canPay = !isFinal && booking.paymentStatus === "unpaid" && paymentReady && openDepositCents > 0;
  const durationMinutes = Math.round((Date.parse(booking.endsAt) - Date.parse(booking.startsAt)) / 60_000);
  const startDay = amsterdamDay(new Date(booking.startsAt));

  return (
    <div className="space-y-5">
      <header>
        <h1 className={headingClass}>{APPOINTMENT_STATUS_HEADLINES[booking.status] ?? "Je afspraak"}</h1>
        <p className="mt-3 text-base text-steel-400">
          Referentie <span className="figures font-medium text-steel-100">{booking.reference}</span>
        </p>
        <p className="mt-3">
          <span className={chipClass(PAYMENT_STATUS_TONES[booking.paymentStatus] ?? "neutral")}>
            {PAYMENT_STATUS_LABELS[booking.paymentStatus] ?? booking.paymentStatus}
          </span>
        </p>
      </header>

      {paymentFailed && !isFinal && (
        <Notice tone="warn" title="De betaling is niet gestart">
          Je boeking is wel vastgelegd. Probeer het opnieuw met de betaalknop hieronder.
        </Notice>
      )}

      {!paymentReady && !isFinal && (
        <Notice tone="warn" title="Testmodus">
          Online betalen is nog niet actief. Je boeking is wel vastgelegd.
        </Notice>
      )}

      {offRoute ? (
        <Notice
          tone="bad"
          title={booking.status === "cancelled" ? "Deze afspraak gaat niet door" : "De betaling is niet op tijd afgerond"}
        >
          {booking.status === "cancelled"
            ? booking.paidCents > 0
              ? "Je had al betaald. Wij nemen contact met je op over de terugbetaling."
              : "Er staat niets meer open. Wil je toch een reparatie? Boek dan een nieuwe afspraak."
            : "Daarom is de reservering vervallen. Wil je toch een reparatie? Boek dan een nieuwe afspraak."}
        </Notice>
      ) : (
        <section className={stepPanelClass} aria-labelledby="route-title">
          <h2 id="route-title" className={panelTitleClass}>
            Status
          </h2>
          <div className="mt-5">
            <StatusRoute status={booking.status} />
          </div>
        </section>
      )}

      <section className={stepPanelClass} aria-labelledby="details-title">
        <h2 id="details-title" className={panelTitleClass}>
          Afspraak
        </h2>
        <dl className="mt-2 divide-y divide-line">
          <DetailRow icon={<CalendarBlankIcon size={20} aria-hidden="true" />} label="Wanneer">
            <p className="font-medium text-steel-50">{formatDayLong(startDay)}</p>
            <p className="figures text-steel-300">
              Van {formatClock(booking.startsAt)} tot {formatClock(booking.endsAt)}
            </p>
            <p className="mt-1 text-sm text-steel-400">
              Tijdslot van <span className="figures">{formatDuration(durationMinutes)}</span>. Zodra de reparatietijd voorbij
              is, heb je je toestel terug.
            </p>
          </DetailRow>
          <DetailRow icon={<MapPinIcon size={20} aria-hidden="true" />} label="Adres">
            <p className="break-words text-steel-100">
              {booking.street} {booking.houseNumber}
            </p>
            <p className="text-steel-300">
              <span className="figures">{formatPostcode(booking.postcode)}</span> {booking.city}
            </p>
          </DetailRow>
          <DetailRow icon={<DeviceMobileIcon size={20} aria-hidden="true" />} label="Toestel">
            <p className="break-words text-steel-100">{booking.modelLabel}</p>
          </DetailRow>
        </dl>
      </section>

      <Receipt
        lines={booking.items.map((item) => ({
          key: item.repairTypeId,
          name: item.name,
          detail: [item.qualityName, formatDuration(item.durationMinutes)].filter(Boolean).join(", "),
          cents: item.priceCents,
        }))}
        travelCents={booking.travelFeeCents}
        totalCents={booking.totalCents}
      >
        <AmountRow label="Betaald" cents={booking.paidCents} strong />
        {openDepositCents > 0 && !offRoute && (
          <AmountRow
            label={booking.paymentChoice === "full" ? "Nog te betalen, vooraf" : "Nog te betalen, aanbetaling"}
            cents={openDepositCents}
          />
        )}
        {restCents > 0 && !offRoute && (
          <AmountRow label="Bij oplevering" detail="Met pin of contant" cents={restCents} />
        )}
      </Receipt>

      {canPay && (
        <section className={stepPanelClass} aria-labelledby="pay-title">
          <h2 id="pay-title" className={panelTitleClass}>
            Betaling staat nog open
          </h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-steel-300">
            {booking.paymentChoice === "full" ? "Betaal" : "Betaal de aanbetaling van"}{" "}
            <span className="figures">{formatEuro(openDepositCents)}</span> om je afspraak te bevestigen.
          </p>
          <div className="mt-4">
            <PayButton reference={booking.reference} token={token} label={`Betaal ${formatEuro(openDepositCents)}`} />
          </div>
        </section>
      )}

      {canCancel && (
        <section className={stepPanelClass} aria-labelledby="cancel-title">
          <h2 id="cancel-title" className={panelTitleClass}>
            Afspraak annuleren
          </h2>
          <p className="mb-4 mt-2 text-[0.9375rem] leading-relaxed text-steel-300">
            Je kunt annuleren tot het begin van je afspraak.
          </p>
          <CancelBooking reference={booking.reference} token={token} />
        </section>
      )}
    </div>
  );
}

function DetailRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3.5 py-4 last:pb-1">
      <span className="mt-0.5 shrink-0 text-cyan-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <dt className="text-sm text-steel-400">{label}</dt>
        <dd className="mt-1 space-y-0.5 text-[0.9375rem] leading-relaxed">{children}</dd>
      </div>
    </div>
  );
}

function Message({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={stepPanelClass}>
      <h1 className={headingClass}>{title}</h1>
      <p className="mt-3 text-base leading-relaxed text-steel-400">{children}</p>
    </section>
  );
}

function InvalidLink() {
  return (
    <Message title="Deze link klopt niet">
      Gebruik de volledige link uit je bevestiging, inclusief alles na het vraagteken. Lukt het nog steeds niet? Neem
      dan contact met ons op en noem je referentie.
    </Message>
  );
}

function StatusSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Je afspraak laden</span>
      <div>
        <div className={`${skeletonClass} h-10 w-4/5`} />
        <div className={`${skeletonClass} mt-3 h-5 w-1/2`} />
      </div>
      <div className={stepPanelClass}>
        <div className={`${skeletonClass} h-5 w-24`} />
        <div className="mt-5 space-y-5">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className={`${skeletonClass} size-4 rounded-full`} />
              <div className={`${skeletonClass} h-4 w-1/3`} />
            </div>
          ))}
        </div>
      </div>
      <div className={stepPanelClass}>
        <div className={`${skeletonClass} h-4 w-2/3`} />
        <div className={`${skeletonClass} mt-3 h-4 w-1/2`} />
      </div>
    </div>
  );
}
