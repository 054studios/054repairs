import { WarningCircleIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { fieldErrorClass, hintClass, inputClass, labelClass, stepPanelClass } from "@/lib/booking/styles";
import { StepHeading } from "./step-heading";

type Customer = { name: string; phone: string; email: string; note: string };
type Field = keyof Customer;

export function StepDetails({
  customer,
  errors,
  onChange,
  onBlur,
}: {
  customer: Customer;
  errors: Partial<Record<Field, string>>;
  onChange: (field: Field, value: string) => void;
  onBlur: (field: Field) => void;
}) {
  function describedBy(field: Field, hint?: boolean) {
    const ids = [hint ? `${field}-hint` : null, errors[field] ? `${field}-error` : null].filter(Boolean);
    return ids.length > 0 ? ids.join(" ") : undefined;
  }

  return (
    <>
      <StepHeading title="Hoe bereiken wij je?" text="Wij gebruiken je gegevens alleen voor deze afspraak." />

      <div className={`${stepPanelClass} space-y-5`}>
        <FieldBlock id="name" label="Naam" error={errors.name}>
          <input
            id="name"
            name="name"
            autoComplete="name"
            value={customer.name}
            onChange={(event) => onChange("name", event.target.value)}
            onBlur={() => onBlur("name")}
            aria-invalid={errors.name !== undefined}
            aria-describedby={describedBy("name")}
            className={inputClass}
          />
        </FieldBlock>

        <FieldBlock id="phone" label="Telefoonnummer" error={errors.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={customer.phone}
            onChange={(event) => onChange("phone", event.target.value)}
            onBlur={() => onBlur("phone")}
            aria-invalid={errors.phone !== undefined}
            aria-describedby={describedBy("phone")}
            className={`${inputClass} figures`}
          />
        </FieldBlock>

        <FieldBlock id="email" label="E-mailadres" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="off"
            spellCheck={false}
            value={customer.email}
            onChange={(event) => onChange("email", event.target.value)}
            onBlur={() => onBlur("email")}
            aria-invalid={errors.email !== undefined}
            aria-describedby={describedBy("email")}
            className={inputClass}
          />
        </FieldBlock>

        <FieldBlock
          id="note"
          label="Opmerking"
          optional
          hint="Bijvoorbeeld waar wij kunnen parkeren of bij welke deur wij aanbellen."
          error={errors.note}
        >
          <textarea
            id="note"
            name="note"
            rows={3}
            maxLength={500}
            value={customer.note}
            onChange={(event) => onChange("note", event.target.value)}
            onBlur={() => onBlur("note")}
            aria-invalid={errors.note !== undefined}
            aria-describedby={describedBy("note", true)}
            className={`${inputClass} resize-y py-3 leading-relaxed`}
          />
        </FieldBlock>
      </div>
    </>
  );
}

function FieldBlock({
  id,
  label,
  optional = false,
  hint,
  error,
  children,
}: {
  id: Field;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {optional && <span className="font-normal text-steel-400"> (optioneel)</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className={`${hintClass} mt-1`}>
          {hint}
        </p>
      )}
      <div className="mt-2">{children}</div>
      {error && (
        <p id={`${id}-error`} role="alert" className={fieldErrorClass}>
          <WarningCircleIcon size={18} aria-hidden="true" className="mt-px shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
