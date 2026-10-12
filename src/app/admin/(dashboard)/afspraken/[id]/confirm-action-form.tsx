"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/action-result";

type FormAction = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

// A submit button that asks for confirmation first. Cancelling the dialog stops the submit.
export function ConfirmActionForm({
  action,
  label,
  question,
}: {
  action: FormAction;
  label: string;
  question: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        onClick={(event) => {
          if (!window.confirm(question)) {
            event.preventDefault();
          }
        }}
        className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
      >
        {pending ? "Bezig…" : label}
      </button>
      {state && (
        <p role="status" className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
