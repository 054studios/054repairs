"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { CircleNotchIcon } from "@phosphor-icons/react";

// Submit button for plain server-action forms (delete, sign out). While the form is
// sending, the icon turns into a spinner and the button is disabled.
export function SubmitButton({
  children,
  className,
  icon,
  label,
}: {
  children?: ReactNode;
  className: string;
  icon?: ReactNode;
  label?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} aria-busy={pending} aria-label={label} className={className}>
      {pending ? <CircleNotchIcon aria-hidden="true" className="size-5 shrink-0 animate-spin" /> : icon}
      {children}
    </button>
  );
}
