"use client";

import { useActionState, type ReactNode } from "react";
import type { ActionResult } from "@/lib/action-result";

type FormAction = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

export function ActionForm({
  action,
  children,
  submitLabel = "Opslaan",
  className = "",
}: {
  action: FormAction;
  children?: ReactNode;
  submitLabel?: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className={className}>
      {children}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-800 disabled:opacity-60"
        >
          {pending ? "Bezig…" : submitLabel}
        </button>
        {state && (
          <p
            role="status"
            className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
