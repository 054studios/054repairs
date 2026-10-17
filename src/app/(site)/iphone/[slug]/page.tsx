import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getCatalogue } from "@/components/site/data";
import { pricedCatalogue } from "@/components/site/catalogue";
import { RepairPriceList } from "@/components/site/repair-price-list";
import { Breadcrumbs } from "@/components/site/structured-data";
import { pageMetadata } from "@/components/site/seo";
import { Container, PageHeader, ClosingCta } from "@/components/site/ui";
import { slugify } from "@/lib/slug";
export const instant = false;
type Props = { params: Promise<{ slug: string }> };
async function readModel(slug: string) {
  const catalogue = await getCatalogue();
  if (!catalogue) throw new Error("Catalogus tijdelijk niet beschikbaar.");
  const model = pricedCatalogue(catalogue).models.find(
    (m) => slugify(m.name) === slug,
  );
  if (!model) notFound();
  return { catalogue, model };
}
export async function generateMetadata({ params }: Props) {
  const { model } = await readModel((await params).slug);
  return pageMetadata(
    `${model.name} reparatie aan huis`,
    `Bekijk prijzen en reparatieduur voor jouw ${model.name}. Kies een reparatie op locatie en boek online bij 054repairs.`,
    `/iphone/${slugify(model.name)}`,
  );
}
export default async function ModelPage({ params }: Props) {
  await connection();
  const { catalogue, model } = await readModel((await params).slug);
  return (
    <>
      <PageHeader
        title={`${model.name} reparatie aan huis`}
        lead={`Bekijk welke reparaties we voor je ${model.name} aanbieden. Je kiest de kwaliteit en ziet de prijs en duur voordat je boekt.`}
      />
      <Container className="space-y-8 pb-20">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Prijzen", path: "/prijzen" },
            { name: model.name, path: `/iphone/${slugify(model.name)}` },
          ]}
        />
        <p className="max-w-[65ch] leading-relaxed text-steel-300">
          Wij rijden naar je adres en repareren je iPhone op locatie. De prijzen
          hieronder gelden voor de reparatie; eventuele voorrijkosten zie je
          voordat je betaalt. Maak vooraf een back-up van je toestel.
        </p>
        <RepairPriceList catalogue={catalogue} modelId={model.id} />
      </Container>
      <ClosingCta title="Je iPhone gerepareerd, bij jou voor de deur." />
    </>
  );
}
