import { PencilSimpleIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { addMinutesIso, formatClock, formatDayLong, formatDuration, formatKm, formatPostcode } from "@/lib/booking/format";
import { depositCentsFor } from "@/lib/booking/pricing";
import { optionClass, stepPanelClass } from "@/lib/booking/styles";
import type { AddressSuggestion, PaymentChoice, PublicSettings, TravelQuote } from "@/lib/booking/types";
import { formatEuro } from "@/lib/money";
import { Notice } from "./notice";
import { AmountRow, Receipt } from "./receipt";
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
  travel,
  day,
  startsAt,
  durationMinutes,
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
  travel: TravelQuote | null;
  day: string | null;
  startsAt: string | null;
  durationMinutes: number;
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
  const travelDetail = travel
    ? `${formatKm(travel.km)}${travel.source === "estimate" ? ", schatting" : ""}`
    : undefined;

  return (
    <>
      <StepHeading title="Controleer je afspraak" text="Klopt alles? Bevestig dan je boeking." />

      <div className="space-y-4">
        <section aria-label="Je afspraak" className={`${stepPanelClass} py-1 sm:py-1`}>
          <dl className="divide-y divide-line">
            <SummaryRow title="Toestel" onEdit={() => onEdit(0)}>
              <p className="font-medium text-steel-50">{modelName}</p>
            </SummaryRow>

            <SummaryRow title="Reparaties" onEdit={() => onEdit(1)}>
              <ul className="space-y-0.5">
                {lines.map((line) => (
                  <li key={line.key} className="text-steel-100">
                    {line.name}
                    {line.quality && <span className="text-steel-400">, {line.quality}</span>}
                  </li>
                ))}
              </ul>
            </SummaryRow>

            <SummaryRow title="Adres" onEdit={() => onEdit(2)}>
              {address && (
                <p className="break-words text-steel-100">
                  {address.street} {address.houseNumber}
                  <br />
                  <span className="figures">{formatPostcode(address.postcode)}</span> {address.city}
                </p>
              )}
            </SummaryRow>

            <SummaryRow title="Datum en tijd" onEdit={() => onEdit(3)}>
              {day && startsAt && (
                <>
                  <p className="font-medium text-steel-50">{formatDayLong(day)}</p>
                  <p className="figures text-steel-300">
                    Van {formatClock(startsAt)} tot {formatClock(addMinutesIso(startsAt, durationMinutes))}
                  </p>
                </>
              )}
            </SummaryRow>

            <SummaryRow title="Gegevens" onEdit={() => onEdit(4)}>
              <p className="break-words text-steel-100">{customer.name}</p>
              <p className="figures text-steel-300">{customer.phone}</p>
              <p className="break-all text-steel-300">{customer.email}</p>
              {customer.note && <p className="mt-1.5 break-words text-sm text-steel-400">{customer.note}</p>}
            </SummaryRow>
          </dl>
        </section>

        <Receipt
          subtitle={modelName}
          lines={lines.map((line) => ({
            key: line.key,
            name: line.name,
            detail: [line.quality, formatDuration(line.durationMinutes)].filter(Boolean).join(", "),
            cents: line.priceCents,
          }))}
          travelCents={feeCents}
          travelDetail={travelDetail}
          totalCents={totalCents}
        >
          {settings.allowFullPrepay && (
            <fieldset className="mb-4">
              <legend className="text-sm font-medium text-steel-300">Wat betaal je nu?</legend>
              <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                <PaymentOption
                  value="deposit"
                  checked={paymentChoice === "deposit"}
                  title="Aanbetaling"
                  text="De rest betaal je bij oplevering."
                  cents={depositPreview}
                  onChange={onPaymentChoice}
                />
                <PaymentOption
                  value="full"
                  checked={paymentChoice === "full"}
                  title="Alles nu"
                  text="Bij oplevering betaal je niets meer."
                  cents={totalCents}
                  onChange={onPaymentChoice}
                />
              </div>
            </fieldset>
          )}

          <AmountRow
            label={mollieReady ? "Nu te betalen" : "Aanbetaling"}
            detail={mollieReady ? "Online, direct na het bevestigen" : "In testmodus wordt niets online afgerekend"}
            cents={depositCents}
            strong
            swapKey={depositCents}
          />
          <AmountRow
            label="Bij oplevering"
            detail={restCents > 0 ? "Met pin of contant" : "Er is dan niets meer te betalen"}
            cents={restCents}
            swapKey={restCents}
          />
        </Receipt>

        {mollieReady ? (
          <Notice tone="info">
            Na het bevestigen ga je direct door naar de betaalpagina.
          </Notice>
        ) : (
          <Notice tone="warn" title="Testmodus">
            Online betalen is nog niet actief. Je boeking wordt wel vastgelegd, zonder betaling.
          </Notice>
        )}
      </div>
    </>
  );
}

function SummaryRow({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-4">
      <div className="min-w-0 flex-1">
        <dt className="text-sm text-steel-400">{title}</dt>
        <dd className="mt-1 space-y-0.5 text-[0.9375rem] leading-relaxed">{children}</dd>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Wijzig ${title.toLowerCase()}`}
        className="-mr-2 inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-ui px-3 text-sm font-medium text-cyan-300 transition-[background-color,color,transform] duration-150 ease-out-strong hover:bg-ink-800 hover:text-cyan-200 active:scale-[0.97]"
      >
        <PencilSimpleIcon size={16} aria-hidden="true" />
        Wijzig
      </button>
    </div>
  );
}

function PaymentOption({
  value,
  checked,
  title,
  text,
  cents,
  onChange,
}: {
  value: PaymentChoice;
  checked: boolean;
  title: string;
  text: string;
  cents: number;
  onChange: (choice: PaymentChoice) => void;
}) {
  return (
    <label className="block cursor-pointer">
      <input
        type="radio"
        name="payment"
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="peer sr-only"
      />
      <span className={`${optionClass} flex h-full flex-col gap-1`}>
        <span className="flex items-baseline justify-between gap-3">
          <span className="font-semibold text-steel-50">{title}</span>
          <span className="figures font-semibold text-steel-50">{formatEuro(cents)}</span>
        </span>
        <span className="text-sm text-steel-400">{text}</span>
      </span>
    </label>
  );
}
