"use client";

import { useActionState, useState } from "react";
import { ArrowSquareOutIcon, CheckIcon, CircleNotchIcon, CopyIcon, LinkSimpleIcon } from "@phosphor-icons/react";
import { StatusMessage } from "@/components/admin/status-message";
import { buttonClass, insetClass } from "@/components/ui/styles";
import type { MollieLinkResult } from "../shared";

type LinkAction = (prev: MollieLinkResult | null, formData: FormData) => Promise<MollieLinkResult>;

// Creates a Mollie link for the open amount and shows it, so the admin can copy it for the customer.
export function MollieLinkForm({ action }: { action: LinkAction }) {
  const [state, formAction, pending] = useActionState(action, null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
    } catch {
      setCopiedUrl(null);
    }
  }

  const checkoutUrl = state?.checkoutUrl;
  const copied = checkoutUrl !== undefined && copiedUrl === checkoutUrl;

  return (
    <form action={formAction} className="space-y-3">
      <button type="submit" disabled={pending} aria-busy={pending} className={buttonClass("secondary")}>
        {pending ? (
          <CircleNotchIcon aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <LinkSimpleIcon aria-hidden="true" className="size-5" />
        )}
        Maak betaallink
      </button>

      <StatusMessage state={state} />

      {checkoutUrl && (
        <div className={`${insetClass} p-3`}>
          <p className="break-all text-sm text-steel-300">{checkoutUrl}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => copy(checkoutUrl)} className={buttonClass("ghost", "md")}>
              {copied ? (
                <CheckIcon aria-hidden="true" className="size-5 text-ok" />
              ) : (
                <CopyIcon aria-hidden="true" className="size-5" />
              )}
              {copied ? "Gekopieerd" : "Kopieer link"}
            </button>
            <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("ghost", "md")}>
              <ArrowSquareOutIcon aria-hidden="true" className="size-5" />
              Open betaalpagina
            </a>
          </div>
        </div>
      )}
    </form>
  );
}
