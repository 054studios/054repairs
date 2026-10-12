"use client";

import Link from "next/link";
import { buttonClass, stepPanelClass } from "@/lib/booking/styles";

// Unexpected failure while rendering the booking flow.
export default function BookingError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="mx-auto w-full max-w-[40rem] px-4 pb-10 pt-6 md:pb-20 md:pt-12">
      <section className={stepPanelClass} role="alert">
        <h1 className="font-display text-[clamp(1.75rem,6.4vw,2.375rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-steel-50">
          Het boeken liep vast
        </h1>
        <p className="mt-3 text-base leading-relaxed text-steel-400">
          Er ging iets mis bij het laden van deze pagina. Laad hem opnieuw om verder te gaan met boeken.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={() => retry()} className={buttonClass("primary", "md")}>
            Laad opnieuw
          </button>
          <Link href="/" className={buttonClass("ghost", "md")}>
            Naar de homepage
          </Link>
        </div>
      </section>
    </div>
  );
}
