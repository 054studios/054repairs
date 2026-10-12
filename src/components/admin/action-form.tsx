"use client";

import { useActionState, type ReactNode } from "react";
import { CircleNotchIcon } from "@phosphor-icons/react";
import type { ActionResult } from "@/lib/action-result";
import { buttonClass, type ButtonVariant } from "@/components/ui/styles";
import { StatusMessage } from "./status-message";

type FormAction = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

// A form bound to a server action, with a submit button that shows it is busy and an
// inline result. "stack" puts the button under the fields, "inline" next to them (row forms).
export function ActionForm({
  action,
  children,
  submitLabel = "Opslaan",
  className = "",
  variant = "primary",
  layout = "stack",
}: {
  action: FormAction;
  children?: ReactNode;
  submitLabel?: string;
  className?: string;
  variant?: ButtonVariant;
  layout?: "stack" | "inline";
}) {
  const [state, formAction, pending] = useActionState(action, null);

  const button = (
    <button type="submit" disabled={pending} aria-busy={pending} className={`${buttonClass(variant, "md")} shrink-0`}>
      {pending && <CircleNotchIcon aria-hidden="true" className="size-4 animate-spin" />}
      {submitLabel}
    </button>
  );

  if (layout === "inline") {
    return (
      <form action={formAction} className={`flex flex-wrap items-end gap-x-3 gap-y-3 ${className}`}>
        <div className="min-w-0 flex-[1_1_12rem]">{children}</div>
        {button}
        <StatusMessage state={state} className="basis-full" />
      </form>
    );
  }

  return (
    <form action={formAction} className={className}>
      {children}
      <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${children ? "mt-5" : ""}`}>
        {button}
        <StatusMessage state={state} />
      </div>
    </form>
  );
}
