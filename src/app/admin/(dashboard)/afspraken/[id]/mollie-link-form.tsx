"use client";

import { useActionState, useState } from "react";
import type { MollieLinkResult } from "../shared";

type LinkAction = (prev: MollieLinkResult | null, formData: FormData) => Promise<MollieLinkResult>;

// Creates a Mollie link for the open amount and shows it, so the admin can copy it for the customer.
export function MollieLinkForm({ action }: { action: LinkAction }) {
  const [state, formAction, pending] = useActionState(action, null);
  const [copied, setCopied] = useState(false);

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const checkoutUrl = state?.checkoutUrl;

  return (
    <form action={formAction} className="space-y-3">
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-800 disabled:opacity-60"
      >
        {pending ? "Bezig…" : "Maak betaallink voor restbedrag"}
      </button>

      {state && (
        <p role="status" className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>
          {state.message}
        </p>
      )}

      {checkoutUrl && (
        <div className="rounded-xl bg-navy-50 p-3">
          <p className="break-all text-sm text-navy-800">{checkoutUrl}</p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
            <button
              type="button"
              onClick={() => copy(checkoutUrl)}
              className="font-medium text-navy-900 underline underline-offset-4"
            >
              {copied ? "Gekopieerd" : "Kopieer link"}
            </button>
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-navy-900 underline underline-offset-4"
            >
              Open betaalpagina
            </a>
          </div>
        </div>
      )}
    </form>
  );
}
