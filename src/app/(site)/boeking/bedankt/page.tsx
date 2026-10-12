import type { Metadata } from "next";
import { Suspense } from "react";
import { isValidReference } from "@/lib/booking/routing";
import { cardClass } from "@/lib/booking/styles";

// Return page after a balance payment (the rest, paid by Mollie).
export const instant = false;

export const metadata: Metadata = {
  title: "Bedankt voor je betaling | 054repairs",
  robots: { index: false, follow: false },
};

type ThanksPageProps = {
  searchParams: Promise<{ ref?: string | string[] }>;
};

export default function BalanceThanksPage(props: ThanksPageProps) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6 md:py-10">
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
    <section className={cardClass}>
      <h1 className="text-2xl font-semibold tracking-tight text-navy-950">Bedankt voor je betaling</h1>
      <p className="mt-3 text-base text-navy-700">
        We verwerken je betaling. Dat kan even duren. Je ontvangt een bevestiging per e-mail.
      </p>
      {reference && (
        <p className="mt-4 text-base text-navy-800">
          Referentie: <strong className="break-all text-navy-950">{reference}</strong>
        </p>
      )}
    </section>
  );
}

function ThanksSkeleton() {
  return (
    <div className={cardClass} aria-busy="true">
      <div className="h-7 w-2/3 rounded-lg bg-navy-100" />
      <div className="mt-3 h-4 w-full rounded-lg bg-navy-100" />
    </div>
  );
}
