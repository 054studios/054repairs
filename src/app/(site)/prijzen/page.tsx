import Link from "next/link";
import { Suspense } from "react";
import { PriceTableSkeleton } from "@/components/site/loading-skeletons";
import { slugify } from "@/lib/slug";
import { pageMetadata } from "@/components/site/seo";
import {
  getCatalogue,
  getPublicSettings,
  type Catalogue,
} from "@/components/site/data";
import { pricedCatalogue } from "@/components/site/catalogue";
import { travelSummary } from "@/components/site/facts";
import { ModelPrices } from "@/components/site/model-prices";
import {
  ClosingCta,
  Container,
  Notice,
  PageHeader,
} from "@/components/site/ui";
import { h2Class } from "@/components/ui/styles";

// Prices and settings are read from the database on each request.
export const instant = false;

export const metadata = pageMetadata(
  "iPhone-reparatie prijzen",
  "Bekijk de prijs en reparatieduur per iPhone-model. Kies je onderdeel en kwaliteit en boek een reparatie op locatie.",
  "/prijzen",
);

export default function PricesPage() {
  return (
    <>
      <PageHeader
        title="Prijzen per model"
        lead="Kies je model. Je ziet per reparatie de vaste prijs in elke kwaliteit, en hoe lang de reparatie duurt."
      />

      <Suspense
        fallback={
          <Container className="pb-20">
            <PriceTableSkeleton />
          </Container>
        }
      >
        <PricesContent />
      </Suspense>
      <ClosingCta title="Prijs gevonden? Boek je tijdstip." />
    </>
  );
}
async function PricesContent() {
  const [settings, catalogue] = await Promise.all([
    getPublicSettings(),
    getCatalogue(),
  ]);
  const priced = catalogue ? pricedCatalogue(catalogue) : null;
  const travel = settings ? travelSummary(settings) : null;
  return (
    <Container className="space-y-14 pb-20 md:space-y-20 md:pb-28">
      <section aria-label="Prijstabel">
        {catalogue === null ? (
          <Notice>
            We kunnen de prijzen nu niet laden. Probeer het later opnieuw.
          </Notice>
        ) : priced && priced.models.length > 0 ? (
          <ModelPrices catalogue={priced} />
        ) : (
          <Notice>
            Er staan nog geen prijzen online. Kijk later nog eens.
          </Notice>
        )}

        <div className="mt-6 max-w-[64ch]">
          <Notice tone="note">
            {travel
              ? `De voorrijkosten komen apart bij de reparatieprijs. ${travel.free} ${travel.over} ${travel.max}`
              : "De voorrijkosten komen apart bij de reparatieprijs. Je ziet het bedrag voordat je betaalt."}
          </Notice>
        </div>
      </section>

      {priced && (
        <nav aria-label="Prijzen per iPhone-model">
          <h2 className={h2Class}>Alle modellen</h2>
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
            {priced.models.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/iphone/${slugify(m.name)}`}
                  className="inline-flex min-h-11 items-center text-cyan-300 underline"
                >
                  {m.name} reparatie
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {catalogue ? <Explained catalogue={catalogue} /> : null}
    </Container>
  );
}

// What the repairs and qualities mean, from the descriptions in the admin.
function Explained({ catalogue }: { catalogue: Catalogue }) {
  const qualities = catalogue.qualities.filter(
    (quality) => quality.description,
  );
  const repairs = catalogue.repairTypes.filter((type) => type.description);

  if (qualities.length === 0 && repairs.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="uitleg-titel">
      <h2 id="uitleg-titel" className={h2Class}>
        Wat de keuzes betekenen
      </h2>
      <div className="mt-10 grid gap-x-16 gap-y-10 border-t border-line pt-10 md:grid-cols-2">
        {qualities.length > 0 ? (
          <div>
            <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-steel-50">
              Kwaliteit
            </h3>
            <dl className="mt-4 space-y-5">
              {qualities.map((quality) => (
                <div key={quality.id}>
                  <dt className="font-medium text-steel-100">{quality.name}</dt>
                  <dd className="mt-1 max-w-[52ch] leading-relaxed text-steel-400">
                    {quality.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
        {repairs.length > 0 ? (
          <div>
            <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-steel-50">
              Reparaties
            </h3>
            <dl className="mt-4 space-y-5">
              {repairs.map((type) => (
                <div key={type.id}>
                  <dt className="font-medium text-steel-100">{type.name}</dt>
                  <dd className="mt-1 max-w-[52ch] leading-relaxed text-steel-400">
                    {type.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </div>
    </section>
  );
}
