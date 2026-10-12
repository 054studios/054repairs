import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-950 outline-none transition focus:border-navy-600 focus:ring-2 focus:ring-navy-600/20";

export function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-navy-100 md:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-navy-950">{title}</h2>
      {description && <p className="mt-1 text-sm text-navy-600">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-medium text-navy-900">{label}</span>
      {children}
      {hint && <span className="block text-xs text-navy-500">{hint}</span>}
    </label>
  );
}

export function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-navy-900">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-4 rounded border-navy-300 text-navy-900 focus:ring-navy-600"
      />
      {label}
    </label>
  );
}
