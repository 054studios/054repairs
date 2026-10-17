import Link from "next/link";
import type { Catalogue } from "./data";
import { pricedCatalogue, bookingHref } from "./catalogue";
import { Notice } from "./ui";
import { formatEuro } from "@/lib/money";
import { slugify } from "@/lib/slug";

export function RepairPriceList({
  catalogue,
  match,
  modelId,
}: {
  catalogue: Catalogue | null;
  match?: string;
  modelId?: string;
}) {
  if (!catalogue)
    return (
      <Notice>
        De prijzen zijn nu niet te laden. Probeer het later opnieuw of neem
        contact op.
      </Notice>
    );
  const priced = pricedCatalogue(catalogue);
  const repairs = priced.repairs.filter(
    (r) => !match || new RegExp(match, "i").test(r.name),
  );
  const prices = priced.prices.filter(
    (p) =>
      repairs.some((r) => r.id === p.repairTypeId) &&
      (!modelId || p.modelId === modelId),
  );
  if (!prices.length)
    return (
      <Notice>
        Voor deze keuze staat momenteel geen reparatie online. Neem contact op
        om de mogelijkheden te bespreken.
      </Notice>
    );
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {priced.models
        .filter((m) => prices.some((p) => p.modelId === m.id))
        .map((model) => (
          <section
            key={model.id}
            className="rounded-panel bg-ink-900 p-5 ring-1 ring-line"
          >
            <h3 className="text-xl font-semibold">
              <Link
                href={`/iphone/${slugify(model.name)}`}
                className="inline-flex min-h-11 items-center underline underline-offset-4"
              >
                {model.name}
              </Link>
            </h3>
            <ul className="mt-3 divide-y divide-line">
              {prices
                .filter((p) => p.modelId === model.id)
                .map((p) => (
                  <li key={p.repairTypeId + p.qualityId} className="py-3">
                    <p className="font-medium">
                      {repairs.find((r) => r.id === p.repairTypeId)?.name}
                    </p>
                    <p className="mt-1 text-sm text-steel-400">
                      {priced.qualities.find((q) => q.id === p.qualityId)?.name}{" "}
                      · {p.durationMinutes} minuten
                    </p>
                    <Link
                      href={bookingHref({
                        modelId: model.id,
                        repairTypeId: p.repairTypeId,
                        qualityId: p.qualityId,
                      })}
                      className="mt-2 inline-flex min-h-11 items-center gap-2 text-cyan-300 underline underline-offset-4"
                    >
                      Boek voor {formatEuro(p.priceCents)}{" "}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
