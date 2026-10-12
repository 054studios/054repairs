"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CircleNotchIcon, XCircleIcon } from "@phosphor-icons/react";
import { StatusMessage } from "@/components/admin/status-message";
import { buttonClass } from "@/components/ui/styles";
import type { ActionResult } from "@/lib/action-result";

type FormAction = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

// A destructive action with an inline confirmation instead of a browser dialog.
// The first button only opens the question; the submit sits next to a safe way back.
export function ConfirmActionForm({
  action,
  label,
  question,
  confirmLabel = `Ja, ${label.charAt(0).toLowerCase()}${label.slice(1)}`,
  backLabel = "Terug",
}: {
  action: FormAction;
  label: string;
  question: string;
  confirmLabel?: string;
  backLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [confirming, setConfirming] = useState(false);
  const openRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const touched = useRef(false);

  // Keyboard focus follows the step: onto the safe button when the question opens,
  // back onto the first button when it closes.
  useEffect(() => {
    if (!touched.current) {
      return;
    }

    if (confirming) {
      backRef.current?.focus();
    } else {
      openRef.current?.focus();
    }
  }, [confirming]);

  function toggle(next: boolean) {
    touched.current = true;
    setConfirming(next);
  }

  return (
    <form action={formAction}>
      {confirming ? (
        <div className="rounded-ui bg-bad/10 p-4 ring-1 ring-bad/30 transition-[opacity,translate] duration-200 ease-out-strong starting:-translate-y-1 starting:opacity-0">
          <p className="text-[0.95rem] leading-relaxed text-steel-100">{question}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="submit" disabled={pending} aria-busy={pending} className={buttonClass("danger")}>
              {pending ? (
                <CircleNotchIcon aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <XCircleIcon aria-hidden="true" className="size-5" />
              )}
              {confirmLabel}
            </button>
            <button
              ref={backRef}
              type="button"
              disabled={pending}
              onClick={() => toggle(false)}
              className={buttonClass("ghost")}
            >
              {backLabel}
            </button>
          </div>
        </div>
      ) : (
        <button ref={openRef} type="button" onClick={() => toggle(true)} className={buttonClass("danger")}>
          <XCircleIcon aria-hidden="true" className="size-5" />
          {label}
        </button>
      )}
      <StatusMessage state={state} className="mt-3" />
    </form>
  );
}
