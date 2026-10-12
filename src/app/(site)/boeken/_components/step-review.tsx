import type { ReactNode } from "react";
import { depositCentsFor } from "@/lib/booking/pricing";
import { addMinutesIso, formatClock, formatDayLong, formatDuration, formatPostcode } from "@/lib/booking/format";
import { cardClass, optionClass } from "@/lib/booking/styles";
import type { AddressSuggestion, PaymentChoice, PublicSettings } from "@/lib/booking/types";
import { formatEuro } from "@/lib/money";
import { StepHeading } from "./step-heading";

export type ReviewLine = {
  key: string;
  name: string;
  quality: string;
  priceCents: number;
  durationMinutes: number;
};

type Customer = { name: string; phone: string; email: string; note: string };

export function StepReview({
  settings,
  modelName,
  lines,
  address,
  day,
  startsAt,
  durationMinutes,
  repairTotalCents,
  feeCents,
  totalCents,
  depositCents,
  paymentChoice,
  mollieReady,
  customer,
  onPaymentChoice,
  onEdit,
}: {
  settings: PublicSettings;
  modelName: string;
  lines: ReviewLine[];
  address: AddressSuggestion | null;
  day: string | null;
  startsAt: string | null;
  durationMinutes: number;
  repairTotalCents: number;
  feeCents: number;
  totalCents: number;
  depositCents: number;
  paymentChoice: PaymentChoice;
  mollieReady: boolean;
  customer: Customer;
  onPaymentChoice: (choice: PaymentChoice) => void;
  onEdit: (step: number) => void;
}) {
  const restCents = totalCents - depositCents;
  const depositPreview = depositCentsFor(totalCents, settings, "deposit");

  return (
    <>
      <StepHeading title="Controleer je afspraak" text="Klopt alles? Dan boeken we je afspraak." />

      <div className="space-y-4">
        <Section title="Toestel" onEdit={() => onEdit(0)}>
          <p className="text-base font-medium text-navy-950">{modelName}</p>
        </Section>

        <Section title="Reparaties" onEdit={() => onEdit(1)}>
          <ul className="space-y-3">
            {lines.map((line) => (
              <li key={line.key} className="flex justify-between gap-4 text-base">
                <span className="min-w-0">
                  <span className="block font-medium text-navy-950">{line.name}</span>
                  <span className="block text-sm text-navy-600">
                    {line.quality} · {formatDuration(line.durationMinutes)}
                  </span>
                </span>
                <span className="shrink-0 font-medium text-navy-950">{formatEuro(line.priceCents)}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Adres" onEdit={() => onEdit(2)}>
          {address && (
            <p className="break-words text-base text-navy-950">
              {address.street} {address.houseNumber}
              <br />
              {formatPostcode(address.postcode)} {address.city}
            </p>
          )}
        </Section>

        <Section title="Datum en tijd" onEdit={() => onEdit(3)}>
          {day && startsAt && (
            <>
              <p className="text-base font-medium text-navy-950">{formatDayLong(day)}</p>
              <p className="text-base text-navy-800">
                Van {formatClock(startsAt)} tot {formatClock(addMinutesIso(startsAt, durationMinutes))}
              </p>
            </>
          )}
        </Section>

        <Section title="Gegevens" onEdit={() => onEdit(4)}>
          <p className="break-words text-base text-navy-950">{customer.name}</p>
          <p className="text-base text-navy-800">{customer.phone}</p>
          <p className="break-all text-base text-navy-800">{customer.email}</p>
          {customer.note && <p className="mt-2 break-words text-sm text-navy-600">{customer.note}</p>}
        </Section>

        <section className={cardClass} aria-labelledby="payment-title">
          <h2 id="payment-title" className="text-base font-semibold text-navy-950">
            Kosten en betaling
          </h2>

          <dl className="mt-4 space-y-2 text-base">
            <Row label="Reparaties" value={formatEuro(repairTotalCents)} />
            <Row label="Voorrijkosten" value={feeCents === 0 ? "Gratis" : formatEuro(feeCents)} />
            <div className="flex justify-between gap-4 border-t border-navy-100 pt-3 text-lg font-semibold text-navy-950">
              <dt>Totaal</dt>
              <dd>{formatEuro(totalCents)}</dd>
            </div>
          </dl>

          {settings.allowFullPrepay ? (
            <fieldset className="mt-6">
              <legend className="text-sm font-medium text-navy-900">Hoe wil je nu betalen?</legend>
              <div className="mt-3 grid gap-2">
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value="deposit"
                    checked={paymentChoice === "deposit"}
                    onChange={() => onPaymentChoice("deposit")}
                    className="peer sr-only"
                  />
                  <span className={`${optionClass} flex items-center justify-between gap-3`}>
                    <span>
                      <span className="block font-medium text-navy-950">Aanbetaling</span>
                      <span className="block text-sm text-navy-600">Rest betaal je bij oplevering</span>
                    </span>
                    <span className="font-semibold text-navy-950">{formatEuro(depositPreview)}</span>
                  </span>
                </label>
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value="full"
                    checked={paymentChoice === "full"}
                    onChange={() => onPaymentChoice("full")}
                    className="peer sr-only"
                  />
                  <span className={`${optionClass} flex items-center justify-between gap-3`}>
                    <span>
                      <span className="block font-medium text-navy-950">Alles nu betalen</span>
                      <span className="block text-sm text-navy-600">Dan hoef je bij oplevering niets te betalen</span>
                    </span>
                    <span className="font-semibold text-navy-950">{formatEuro(totalCents)}</span>
                  </span>
                </label>
              </div>
            </fieldset>
          ) : null}

          <div className="mt-6 rounded-xl bg-navy-50 p-4 text-sm text-navy-800 ring-1 ring-navy-100">
            <p>
              Je betaalt nu <strong>{formatEuro(depositCents)}</strong>.
              {restCents > 0
                ? ` De rest, ${formatEuro(restCents)}, betaal je met pin of contant zodra we je toestel terugbrengen.`
                : " Er is niets meer te betalen."}
            </p>
            {mollieReady && <p className="mt-2 text-navy-700">Na het boeken ga je naar de betaalpagina.</p>}
          </div>
        </section>
      </div>
    </>
  );
}

function Section({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <section className={cardClass} aria-label={title}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-navy-600">{title}</h2>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md text-sm font-medium text-navy-700 underline underline-offset-4 hover:text-navy-950 focus-visible:outline-2 focus-visible:outline-navy-600"
        >
          Wijzig
        </button>
      </div>
      <div className="mt-2 space-y-1">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-navy-700">{label}</dt>
      <dd className="font-medium text-navy-950">{value}</dd>
    </div>
  );
}
