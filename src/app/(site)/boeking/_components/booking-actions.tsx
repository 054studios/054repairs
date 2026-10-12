"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/action-result";
import { primaryButton, secondaryButton } from "@/lib/booking/styles";
import { cancelBookingAction, createPaymentLinkAction } from "../actions";

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
      <button type="button" onClick={pay} disabled={pending} className={`${primaryButton} sm:w-auto`}>
        {pending ? "Even geduld…" : label}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function CancelBooking({ reference, token }: { reference: string; token: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function cancel() {
    startTransition(async () => {
      const outcome = await cancelBookingAction(reference, token);
      setResult(outcome);

      if (outcome.ok) {
        router.refresh();
      }
    });
  }

  if (result?.ok) {
    return (
      <p role="status" className="text-sm text-emerald-800">
        {result.message}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {confirming ? (
        <>
          <p className="text-sm text-navy-800">Weet je zeker dat je deze afspraak wilt annuleren?</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="inline-flex w-full items-center justify-center rounded-xl bg-red-700 px-5 py-3.5 text-base font-semibold text-white transition hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:opacity-60 sm:w-auto"
            >
              {pending ? "Even geduld…" : "Ja, annuleer"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className={`${secondaryButton} sm:w-auto`}
            >
              Nee, houd de afspraak
            </button>
          </div>
        </>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className={`${secondaryButton} sm:w-auto`}>
          Afspraak annuleren
        </button>
      )}

      {result && !result.ok && (
        <p role="alert" className="text-sm text-red-700">
          {result.message}
        </p>
      )}
    </div>
  );
}
