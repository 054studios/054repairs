import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { loadBookingCatalog, loadModelOptions } from "@/lib/booking/catalog";
import { idSchema } from "@/lib/booking/schema";
import { BookingSkeleton } from "@/components/site/loading-skeletons";
import { buttonClass, stepPanelClass } from "@/lib/booking/styles";
import type { BookingCatalog } from "@/lib/booking/types";
import { createClient } from "@/lib/supabase/server";
import { BookingWizard, type WizardPreset } from "./_components/booking-wizard";

export const metadata: Metadata = {
  title: "Online een reparatie boeken",
  robots: { index: false, follow: true },
  description:
    "Boek in een paar stappen een iPhone-reparatie bij jou in de buurt. Wij rijden naar je toe en repareren ter plekke in de bus.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function BoekenPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="mx-auto w-full max-w-[40rem] px-4 pb-10 pt-6 md:pb-20 md:pt-12">
      <Suspense fallback={<BookingSkeleton />}>
        <BookingLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function single(value: string | string[] | undefined): string | null {
  const text = Array.isArray(value) ? value[0] : value;
  return text && idSchema.safeParse(text).success ? text : null;
}

// Preselect from the home price check: /boeken?model=<id>&repair=<id>&quality=<id>.
// Anything that does not match the catalogue is ignored without a message.
async function readPreset(
  searchParams: SearchParams,
  catalog: BookingCatalog,
): Promise<WizardPreset | null> {
  const query = await searchParams;
  const modelId = single(query.model);

  if (!modelId || !catalog.models.some((model) => model.id === modelId)) {
    return null;
  }

  const options = await loadModelOptions(await createClient(), modelId).catch(
    () => null,
  );

  if (!options) {
    return { modelId, options: null, selections: {} };
  }

  const repairId = single(query.repair);
  const qualityId = single(query.quality);
  const selections: Record<string, string> = {};

  if (
    repairId &&
    catalog.repairTypes.some((repair) => repair.id === repairId)
  ) {
    const forRepair = options.filter(
      (option) => option.repairTypeId === repairId,
    );
    const exact = forRepair.find((option) => option.qualityId === qualityId);
    // Without a valid quality, start with the first quality in catalogue order, as the wizard does.
    const rank = new Map(
      catalog.qualities.map((quality, index) => [quality.id, index]),
    );
    const fallback = [...forRepair].sort(
      (a, b) => (rank.get(a.qualityId) ?? 0) - (rank.get(b.qualityId) ?? 0),
    )[0];
    const pick = exact ?? fallback;

    if (pick) {
      selections[repairId] = pick.qualityId;
    }
  }

  return { modelId, options, selections };
}

async function BookingLoader({ searchParams }: { searchParams: SearchParams }) {
  const catalog = await loadBookingCatalog();

  if (!catalog) {
    return (
      <section className={stepPanelClass}>
        <h1 className="font-display text-[clamp(1.75rem,6.4vw,2.375rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-steel-50">
          Boeken lukt op dit moment niet
        </h1>
        <p className="mt-3 text-base leading-relaxed text-steel-400">
          Wij kunnen de toestellen en prijzen nu niet laden. Probeer het over
          een paar minuten opnieuw.
        </p>
        <Link
          href="/boeken"
          prefetch={false}
          className={`${buttonClass("secondary", "md")} mt-5`}
        >
          Probeer opnieuw
        </Link>
      </section>
    );
  }

  const preset = await readPreset(searchParams, catalog);

  return <BookingWizard catalog={catalog} preset={preset} />;
}
