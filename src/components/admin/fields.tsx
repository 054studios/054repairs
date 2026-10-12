import type { ComponentProps, ReactNode } from "react";
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";
import {
  buttonClass,
  hintClass,
  inputClass as baseInputClass,
  labelClass,
  panelClass,
  selectClass,
} from "@/components/ui/styles";

// Admin controls are the site's controls. 16px text, so iOS never zooms in on focus.
export const inputClass = baseInputClass;

// Prices, minutes and km line up in tabular figures.
export const figureInputClass = `${baseInputClass} figures`;

export function Card({
  title,
  description,
  aside,
  className = "",
  children,
}: {
  title: string;
  description?: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`${panelClass} p-4 sm:p-6 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-steel-50">{title}</h2>
          {description && <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-steel-400">{description}</p>}
        </div>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

// A sub-heading inside a card, above a group of fields or a "new item" form.
export function CardSection({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`mt-6 border-t border-line pt-5 ${className}`}>
      <h3 className="font-display text-base font-semibold tracking-[-0.015em] text-steel-50">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

// Label above the control, hint below it. With compactLabel the label is only read out
// on large screens, where a header row above the list names the columns.
export function Field({
  label,
  hint,
  className = "",
  compactLabel = false,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  compactLabel?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className={`${labelClass} ${compactLabel ? "lg:sr-only" : ""}`}>{label}</span>
      {children}
      {hint && <span className={hintClass}>{hint}</span>}
    </label>
  );
}

// Native select with the caret drawn on top. Still a real select, so the phone shows its own picker.
export function Select({ className = "", children, ...props }: ComponentProps<"select">) {
  return (
    <span className={`relative block ${className}`}>
      <select {...props} className={selectClass}>
        {children}
      </select>
      <CaretDownIcon
        aria-hidden="true"
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-steel-400"
      />
    </span>
  );
}

// Number inputs with a unit behind them drop the spin buttons, which would sit on the unit.
const noSpinnerClass =
  "[-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

// Text input with a unit in front (€) or behind (km, min, %). Inside the field's label, the unit
// is part of the name a screen reader reads out.
export function AffixInput({
  prefix,
  suffix,
  className = "",
  ...props
}: ComponentProps<"input"> & { prefix?: string; suffix?: string }) {
  return (
    <span className="relative block">
      {prefix && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-steel-400">
          {prefix}
        </span>
      )}
      <input
        {...props}
        className={`${figureInputClass} ${prefix ? "pl-8" : ""} ${suffix ? `pr-14 ${noSpinnerClass}` : ""} ${className}`}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-steel-400">
          {suffix}
        </span>
      )}
    </span>
  );
}

// A real checkbox, drawn in the brand: ink box, cyan when checked, the check settles in.
export function Checkbox({
  name,
  label,
  defaultChecked,
  compactLabel = false,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  compactLabel?: boolean;
}) {
  return (
    <label className="inline-flex min-h-12 min-w-11 cursor-pointer select-none items-center gap-3 text-[0.95rem] text-steel-100">
      <span className="relative inline-flex size-5 shrink-0">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="peer size-5 cursor-pointer appearance-none rounded-[6px] bg-ink-850 ring-1 ring-line-strong transition-[background-color,box-shadow] duration-150 ease-out-strong hover:ring-steel-500/60 checked:bg-cyan-400 checked:ring-cyan-400"
        />
        <CheckIcon
          weight="bold"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 m-auto size-3.5 scale-50 text-cyan-ink opacity-0 transition-[opacity,scale] duration-150 ease-out-strong peer-checked:scale-100 peer-checked:opacity-100"
        />
      </span>
      <span className={compactLabel ? "lg:sr-only" : undefined}>{label}</span>
    </label>
  );
}

// Column names above a list of row forms, on large screens where the row labels are hidden.
// Invisible copies of the row buttons reserve their width, so the columns line up exactly.
export function RowHeader({
  columns,
  labels,
  buttons = [{ label: "Opslaan", className: buttonClass("secondary") }],
}: {
  columns: string;
  labels: string[];
  buttons?: { label: string; className: string }[];
}) {
  return (
    <div aria-hidden="true" className="hidden gap-3 pb-1 lg:flex">
      <div className={`grid min-w-0 flex-[1_1_12rem] gap-3 text-[0.8125rem] font-medium text-steel-400 ${columns}`}>
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      {buttons.map((button) => (
        <span key={button.label} className="invisible h-0 shrink-0 overflow-hidden">
          <span className={button.className}>{button.label}</span>
        </span>
      ))}
    </div>
  );
}
