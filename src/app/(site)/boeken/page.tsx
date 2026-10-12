import type { Metadata } from "next";
import { Suspense } from "react";
import { loadBookingCatalog } from "@/lib/booking/catalog";
import { cardClass } from "@/lib/booking/styles";
import { BookingWizard } from "./_components/booking-wizard";

export const metadata: Metadata = {
  title: "Online een reparatie boeken",
  description: "Boek in een paar stappen een telefoonreparatie aan huis. Wij halen je toestel op en brengen het terug.",
};

export default function BoekenPage() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6 md:py-10">
      <Suspense fallback={<BookingSkeleton />}>
        <BookingLoader />
      </Suspense>
    </div>
  );
}

async function BookingLoader() {
  const catalog = await loadBookingCatalog();

  if (!catalog) {
    return (
      <section className={cardClass}>
        <h1 className="text-xl font-semibold text-navy-950">Boeken is tijdelijk niet beschikbaar</h1>
        <p className="mt-2 text-base text-navy-600">
          We kunnen de beschikbare toestellen nu niet laden. Probeer het later opnieuw.
        </p>
      </section>
    );
  }

  return <BookingWizard catalog={catalog} />;
}

function BookingSkeleton() {
  return (
    <section className={cardClass} aria-busy="true" aria-live="polite">
      <div className="h-6 w-2/3 rounded-lg bg-navy-100" />
      <div className="mt-3 h-4 w-1/2 rounded-lg bg-navy-100" />
      <div className="mt-6 space-y-3">
        <div className="h-14 rounded-2xl bg-navy-50" />
        <div className="h-14 rounded-2xl bg-navy-50" />
        <div className="h-14 rounded-2xl bg-navy-50" />
      </div>
    </section>
  );
}
