import type { ReactNode } from "react";
import { inputClass } from "@/lib/booking/styles";
import { StepHeading } from "./step-heading";

type Customer = { name: string; phone: string; email: string; note: string };

export function StepDetails({
  customer,
  errors,
  onChange,
}: {
  customer: Customer;
  errors: Partial<Record<keyof Customer, string>>;
  onChange: (field: keyof Customer, value: string) => void;
}) {
  return (
    <>
      <StepHeading title="Je gegevens" text="We gebruiken deze gegevens alleen voor je afspraak." />

      <div className="space-y-5">
        <Field id="name" label="Naam" error={errors.name}>
          <input
            id="name"
            name="name"
            autoComplete="name"
            value={customer.name}
            onChange={(event) => onChange("name", event.target.value)}
            aria-invalid={errors.name !== undefined}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={inputClass}
          />
        </Field>

        <Field id="phone" label="Telefoonnummer" error={errors.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={customer.phone}
            onChange={(event) => onChange("phone", event.target.value)}
            aria-invalid={errors.phone !== undefined}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            className={inputClass}
          />
        </Field>

        <Field id="email" label="E-mailadres" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={customer.email}
            onChange={(event) => onChange("email", event.target.value)}
            aria-invalid={errors.email !== undefined}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={inputClass}
          />
        </Field>

        <Field id="note" label="Opmerking (optioneel)" error={errors.note}>
          <textarea
            id="note"
            name="note"
            rows={3}
            maxLength={500}
            value={customer.note}
            onChange={(event) => onChange("note", event.target.value)}
            placeholder="Bijvoorbeeld: bel even aan bij de achterdeur"
            aria-invalid={errors.note !== undefined}
            aria-describedby={errors.note ? "note-error" : undefined}
            className={inputClass}
          />
        </Field>
      </div>
    </>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-navy-900">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
