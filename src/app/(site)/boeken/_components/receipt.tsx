import type { ReactNode } from "react";
import { stepPanelClass } from "@/lib/booking/styles";
import { formatEuro } from "@/lib/money";

// Receipt-style cost summary. Used by the review step and the status page.
// No hooks and no client icons, so it renders in Server and Client Components.
export type ReceiptLine = { key: string; name: string; detail?: string; cents: number };

export function Receipt({
  title = "Kosten",
  subtitle,
  lines,
  travelCents,
  travelDetail,
  totalCents,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  lines: ReceiptLine[];
  travelCents: number;
  travelDetail?: string;
  totalCents: number;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${stepPanelClass} ${className}`} aria-labelledby="receipt-title">
      <h2 id="receipt-title" className="font-display text-lg font-semibold tracking-[-0.02em] text-steel-50">
        {title}
      </h2>
      {subtitle && <p className="mt-1 break-words text-[0.9375rem] text-steel-400">{subtitle}</p>}

      <dl className="mt-4">
        {lines.map((line) => (
          <ReceiptRow key={line.key} label={line.name} detail={line.detail} cents={line.cents} />
        ))}
        <ReceiptRow label="Voorrijkosten" detail={travelDetail} cents={travelCents} free={travelCents === 0} />
      </dl>

      <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-dashed border-line-strong pt-4">
        <p className="font-medium text-steel-100">Totaal</p>
        <p className="figures font-display text-2xl font-semibold tracking-[-0.02em] text-steel-50">
          {formatEuro(totalCents)}
        </p>
      </div>

      {children && <div className="mt-4 border-t border-line pt-4">{children}</div>}
    </section>
  );
}

function ReceiptRow({
  label,
  detail,
  cents,
  free = false,
}: {
  label: string;
  detail?: string;
  cents: number;
  free?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="min-w-0">
        <span className="block break-words text-[0.9375rem] text-steel-100">{label}</span>
        {detail && <span className="block text-sm text-steel-400">{detail}</span>}
      </dt>
      <dd className="figures shrink-0 text-[0.9375rem] font-medium text-steel-50">{free ? "Gratis" : formatEuro(cents)}</dd>
    </div>
  );
}

// Amount rows under the total: what is paid, what is due now, what is left for the handover.
export function AmountRow({
  label,
  detail,
  cents,
  strong = false,
  swapKey,
}: {
  label: string;
  detail?: string;
  cents: number;
  strong?: boolean;
  swapKey?: string | number;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <div className="min-w-0">
        <p className={strong ? "font-semibold text-steel-50" : "text-[0.9375rem] text-steel-300"}>{label}</p>
        {detail && <p className="text-sm text-steel-400">{detail}</p>}
      </div>
      <p
        key={swapKey}
        className={`figures shrink-0 ${swapKey === undefined ? "" : "figure-swap"} ${
          strong ? "text-lg font-semibold text-steel-50" : "text-[0.9375rem] font-medium text-steel-100"
        }`}
      >
        {formatEuro(cents)}
      </p>
    </div>
  );
}
