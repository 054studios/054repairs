import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { isValidReference } from "@/lib/booking/routing";
import { buttonClass, insetClass, skeletonClass, stepPanelClass } from "@/lib/booking/styles";

// Return page after a balance payment (the rest, paid by Mollie).
export const instant = false;

export const metadata: Metadata = {
  // The (site) layout adds " | 054repairs".
  title: "Bedankt voor je betaling",
  robots: { index: false, follow: false },
};

type ThanksPageProps = {
  searchParams: Promise<{ ref?: string | string[] }>;
};

export default function BalanceThanksPage(props: ThanksPageProps) {
  return (
    <div className="mx-auto w-full max-w-[40rem] px-4 pb-16 pt-8 md:pb-24 md:pt-14">
      <Suspense fallback={<ThanksSkeleton />}>
        <ThanksContent {...props} />
      </Suspense>
    </div>
  );
}

async function ThanksContent({ searchParams }: ThanksPageProps) {
  const query = await searchParams;
  const ref = typeof query.ref === "string" ? query.ref.toUpperCase() : undefined;
  const reference = isValidReference(ref) ? ref : null;

  return (
    <section className={stepPanelClass}>
      {/* The last stop of the route, reached. */}
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-full bg-cyan-400 text-cyan-ink ring-[6px] ring-cyan-400/15"
      >
        <CheckIcon size={18} weight="bold" />
      </span>
      <h1 className="mt-5 font-display text-[clamp(1.875rem,6.8vw,2.75rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-steel-50">
        Bedankt voor je betaling
      </h1>
      <p className="mt-3 text-base leading-relaxed text-steel-400">
        Wij verwerken je betaling. Dat kan even duren. Je ontvangt een bevestiging per e-mail.
      </p>
      {reference && (
        <div className={`${insetClass} mt-5 flex items-baseline justify-between gap-4 px-4 py-3`}>
          <span className="text-sm text-steel-400">Referentie</span>
          <span className="figures break-all font-medium text-steel-50">{reference}</span>
        </div>
      )}
      <Link href="/" className={`${buttonClass("secondary", "md")} mt-6`}>
        Naar de homepage
      </Link>
    </section>
  );
}

function ThanksSkeleton() {
  return (
    <div className={stepPanelClass} aria-busy="true">
      <span className="sr-only">Laden</span>
      <div className={`${skeletonClass} size-8 rounded-full`} />
      <div className={`${skeletonClass} mt-5 h-10 w-3/4`} />
      <div className={`${skeletonClass} mt-3 h-4 w-full`} />
      <div className={`${skeletonClass} mt-2 h-4 w-2/3`} />
    </div>
  );
}
