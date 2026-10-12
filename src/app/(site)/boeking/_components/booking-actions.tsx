"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { ActionResult } from "@/lib/action-result";
import { buttonClass } from "@/lib/booking/styles";
import { Notice } from "../../boeken/_components/notice";
import { cancelBookingAction, createPaymentLinkAction } from "../actions";

function ActionError({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-3 flex items-start gap-1.5 text-sm leading-snug text-bad">
      <WarningCircleIcon size={18} aria-hidden="true" className="mt-px shrink-0" />
      <span>{message}</span>
    </p>
  );
}

export function PayButton({ reference, token, label }: { reference: string; token: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function pay() {
    setError(null);

    startTransition(async () => {
      const result = await createPaymentLinkAction(reference, token);

      if (!result.ok) {
        setError(result.message);
      }
    });
  }

  return (
    <div>
      <button type="button" onClick={pay} disabled={pending} className={`${buttonClass("primary", "lg")} w-full sm:w-auto`}>
        {pending ? "Betaalpagina openen" : label}
      </button>
      {error && <ActionError message={error} />}
    </div>
  );
}

// Inline confirm instead of a modal: the question appears in place, the safe choice gets focus.
export function CancelBooking({ reference, token }: { reference: string; token: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  // Focus follows the question: to the safe choice when it opens, back to the trigger when it closes.
  const focusKeep = useRef(false);
  const focusStart = useRef(false);

  function cancel() {
    startTransition(async () => {
      const outcome = await cancelBookingAction(reference, token);
      setResult(outcome);

      if (outcome.ok) {
        router.refresh();
      }
    });
  }

  function keep() {
    focusStart.current = true;
    setConfirming(false);
    setResult(null);
  }

  function ask() {
    focusKeep.current = true;
    setConfirming(true);
  }

  if (result?.ok) {
    return (
      <Notice tone="ok" role="status">
        {result.message}
      </Notice>
    );
  }

  return (
    <div>
      {confirming ? (
        <div
          role="group"
          aria-labelledby="cancel-question"
          className="rounded-ui bg-bad/[0.06] p-4 ring-1 ring-bad/30 transition-[opacity,translate] duration-200 ease-out-strong motion-safe:starting:-translate-y-1 starting:opacity-0"
        >
          <p id="cancel-question" className="font-semibold text-steel-50">
            Weet je zeker dat je deze afspraak wilt annuleren?
          </p>
          <p className="mt-1 text-[0.9375rem] text-steel-300">Dit kun je niet terugdraaien.</p>
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className={`${buttonClass("danger", "md")} w-full sm:w-auto`}
            >
              {pending ? "Bezig met annuleren" : "Ja, annuleer afspraak"}
            </button>
            <button
              ref={(element) => {
                if (element && focusKeep.current) {
                  focusKeep.current = false;
                  element.focus();
                }
              }}
              type="button"
              onClick={keep}
              disabled={pending}
              className={`${buttonClass("secondary", "md")} w-full sm:w-auto`}
            >
              Nee, houd afspraak
            </button>
          </div>
        </div>
      ) : (
        <button
          ref={(element) => {
            if (element && focusStart.current) {
              focusStart.current = false;
              element.focus();
            }
          }}
          type="button"
          onClick={ask}
          className={`${buttonClass("danger", "md")} w-full sm:w-auto`}
        >
          Annuleer afspraak
        </button>
      )}

      {result && !result.ok && <ActionError message={result.message} />}
    </div>
  );
}
