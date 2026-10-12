import type { Metadata } from "next";
import {
  getCatalogue,
  getPublicSettings,
  type Catalogue,
  type Price,
} from "@/components/site/data";
import { durationLabel, travelSummary } from "@/components/site/facts";
import { Container, Notice, PageHeader } from "@/components/site/ui";
import { formatEuro } from "@/lib/money";

// Prices and settings are read from the database on each request.
export const instant = false;

export const metadata: Metadata = {
  title: "Prijzen",
  description: "Bekijk de prijs per toestel, per reparatie en per kwaliteit. Voorrijkosten komen daar apart bij.",
};

export default async function PricesPage() {
  const [settings, catalogue] = await Promise.all([getPublicSettings(), getCatalogue()]);
  const travel = settings ? travelSummary(settings) : null;

  return (
    <>
      <PageHeader
        title="Prijzen per toestel"
        lead="Kies je toestel en de reparatie. Je ziet de prijs per kwaliteit voordat je boekt."
      />

      <Container className="space-y-16 pb-24">
        <Notice tone="note">
          {travel
            ? `Voorrijkosten komen apart bij de reparatieprijs. ${travel.free} ${travel.over}`
            : "Voorrijkosten komen apart bij de reparatieprijs. Je ziet het bedrag voordat je boekt."}
        </Notice>

        {catalogue === null ? (
          <Notice>We kunnen de prijzen nu niet laden. Probeer het later opnieuw.</Notice>
        ) : (
          <PriceList catalogue={catalogue} />
        )}
      </Container>
    </>
  );
}

function PriceList({ catalogue }: { catalogue: Catalogue }) {
  const pricesByModel = new Map<string, Price[]>();

  for (const price of catalogue.prices) {
    const list = pricesByModel.get(price.modelId) ?? [];
    list.push(price);
    pricesByModel.set(price.modelId, list);
  }

  const brands = catalogue.brands
    .map((brand) => ({
      brand,
      models: catalogue.models
        .filter((model) => model.brandId === brand.id && pricesByModel.has(model.id))
        .map((model) => ({ model, prices: pricesByModel.get(model.id) ?? [] })),
    }))
    .filter((entry) => entry.models.length > 0);

  const explained = [
    ...catalogue.repairTypes.filter((type) => type.description).map((type) => ({ id: type.id, name: type.name, description: type.description })),
    ...catalogue.qualities.filter((quality) => quality.description).map((quality) => ({ id: quality.id, name: quality.name, description: quality.description })),
  ];

  if (brands.length === 0) {
    return <Notice>Er staan nog geen prijzen online. Kijk later nog eens.</Notice>;
  }

  return (
    <>
      {explained.length > 0 ? (
        <section aria-labelledby="uitleg-titel">
          <h2 id="uitleg-titel" className="text-2xl font-extrabold tracking-[-0.02em] text-navy-950 md:text-3xl">
            Wat de reparaties en kwaliteiten inhouden
          </h2>
          <dl className="mt-8 grid gap-x-10 gap-y-6 md:grid-cols-2">
            {explained.map((item) => (
              <div key={item.id}>
                <dt className="font-semibold text-navy-950">{item.name}</dt>
                <dd className="mt-1 leading-relaxed text-navy-800">{item.description}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {brands.map(({ brand, models }) => (
        <section key={brand.id} aria-labelledby={`merk-${brand.id}`}>
          <h2 id={`merk-${brand.id}`} className="text-2xl font-extrabold tracking-[-0.02em] text-navy-950 md:text-3xl">
            {brand.name}
          </h2>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {models.map(({ model, prices }) => (
              <ModelCard key={model.id} name={model.name} prices={prices} catalogue={catalogue} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function ModelCard({ name, prices, catalogue }: { name: string; prices: Price[]; catalogue: Catalogue }) {
  const qualityName = new Map(catalogue.qualities.map((quality) => [quality.id, quality.name]));

  const groups = catalogue.repairTypes.flatMap((type) => {
    const rows = prices
      .filter((price) => price.repairTypeId === type.id)
      .sort((a, b) => a.priceCents - b.priceCents);

    if (rows.length === 0) {
      return [];
    }

    const durations = rows.map((row) => row.durationMinutes);
    return [{ type, rows, duration: durationLabel(Math.min(...durations), Math.max(...durations)) }];
  });

  return (
    <article className="rounded-2xl bg-white p-6 ring-1 ring-navy-100 md:p-7">
      <h3 className="text-xl font-bold tracking-tight text-navy-950">{name}</h3>

      <div className="mt-6 space-y-6">
        {groups.map((group) => (
          <div key={group.type.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-semibold text-navy-950">{group.type.name}</p>
              <p className="text-sm text-navy-700">Duur {group.duration}</p>
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {group.rows.map((row) => (
                <li
                  key={`${row.repairTypeId}-${row.qualityId}`}
                  className="inline-flex items-baseline gap-2 rounded-full bg-navy-50 px-3.5 py-2 text-sm text-navy-900"
                >
                  <span>{qualityName.get(row.qualityId) ?? "Kwaliteit"}</span>
                  <span className="font-bold text-navy-950">{formatEuro(row.priceCents)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </article>
  );
}
