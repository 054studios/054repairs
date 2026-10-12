"use client";

import { buttonClass, stepPanelClass } from "@/lib/booking/styles";

// Unexpected failure on the status page. The booking itself is not affected.
export default function BookingStatusError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="mx-auto w-full max-w-[40rem] px-4 pb-16 pt-8 md:pt-14">
      <section className={stepPanelClass} role="alert">
        <h1 className="font-display text-[clamp(1.75rem,6.4vw,2.375rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-steel-50">
          Je afspraak kan nu niet worden getoond
        </h1>
        <p className="mt-3 text-base leading-relaxed text-steel-400">
          Je boeking blijft gewoon staan. Laad de pagina opnieuw, of open later de link uit je bevestiging.
        </p>
        <button type="button" onClick={() => retry()} className={`${buttonClass("primary", "md")} mt-5`}>
          Laad opnieuw
        </button>
      </section>
    </div>
  );
}
