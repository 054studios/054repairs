"use client";

import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import type { ActionResult } from "@/lib/action-result";

// The result of a form action. The live region is always there, so screen readers hear
// every new message; the message itself rises in a few pixels (opacity and transform only).
export function StatusMessage({ state, className = "" }: { state: ActionResult | null; className?: string }) {
  return (
    <div role="status" className={`min-w-0 ${className}`}>
      {state && (
        <p
          key={`${state.ok}:${state.message}`}
          className={`flex items-start gap-1.5 text-sm font-medium leading-snug transition-[opacity,translate] duration-200 ease-out-strong starting:translate-y-1 starting:opacity-0 ${
            state.ok ? "text-ok" : "text-bad"
          }`}
        >
          {state.ok ? (
            <CheckCircleIcon aria-hidden="true" className="size-[1.125rem] shrink-0" />
          ) : (
            <WarningCircleIcon aria-hidden="true" className="size-[1.125rem] shrink-0" />
          )}
          <span>{state.message}</span>
        </p>
      )}
    </div>
  );
}
