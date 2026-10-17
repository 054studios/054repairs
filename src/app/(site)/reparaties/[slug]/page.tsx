import Link from "next/link";
import { Suspense } from "react";
import { RepairCardsSkeleton } from "@/components/site/loading-skeletons";
import { notFound } from "next/navigation";
import { getCatalogue } from "@/components/site/data";
import { repairPages, repairPage } from "@/components/site/repair-content";
import { RepairPriceList } from "@/components/site/repair-price-list";
import { pageMetadata, absoluteUrl } from "@/components/site/seo";
import { Breadcrumbs, JsonLd } from "@/components/site/structured-data";
import { ClosingCta, Container, PageHeader } from "@/components/site/ui";
import { h2Class } from "@/components/ui/styles";
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() {
  return repairPages.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: Props) {
  const repair = repairPage((await params).slug);
  if (!repair) notFound();
  return pageMetadata(
    repair.title + " aan huis",
    repair.intro,
    `/reparaties/${repair.slug}`,
  );
}
export default async function RepairPage({ params }: Props) {
  const repair = repairPage((await params).slug);
  if (!repair) notFound();
  return (
    <>
      <PageHeader title={repair.title} lead={repair.intro} />
      <Container className="space-y-12 pb-20">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Reparaties", path: "/reparaties" },
            { name: repair.title, path: `/reparaties/${repair.slug}` },
          ]}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Service",
            name: repair.title,
            url: absoluteUrl(`/reparaties/${repair.slug}`),
            description: repair.intro,
            provider: { "@id": absoluteUrl("/#bedrijf") },
            areaServed: {
              "@type": "AdministrativeArea",
              name: "Regio Amsterdam",
            },
          }}
        />
        <section className="max-w-[65ch]">
          <h2 className={h2Class}>Wat merk je aan je iPhone?</h2>
          <p className="mt-4 leading-relaxed text-steel-300">
            {repair.explanation}
          </p>
        </section>
        <section>
          <h2 className={h2Class}>Prijzen en reparatieduur</h2>
          <p className="mb-6 mt-4 text-steel-400">
            Kies je model en kwaliteit. Voorrijkosten komen er eventueel bij;{" "}
            <Link href="/werkgebied" className="underline">
              controleer je adres
            </Link>{" "}
            voor een indicatie.
          </p>
          <Suspense fallback={<RepairCardsSkeleton />}>
            <RepairPrices match={repair.match} />
          </Suspense>
        </section>
        <section className="max-w-[65ch]">
          <h2 className={h2Class}>Voor je afspraak</h2>
          <p className="mt-4 leading-relaxed text-steel-300">
            {repair.preparation}
          </p>
          <p className="mt-4 text-steel-400">
            Wij repareren ter plekke in onze bus. Je ziet de gekozen kwaliteit
            en duur voordat je boekt.{" "}
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center text-cyan-300 underline"
            >
              Stel je vraag
            </Link>
            .
          </p>
        </section>
        <nav aria-label="Andere reparaties" className="flex flex-wrap gap-x-6">
          {repairPages
            .filter((r) => r.slug !== repair.slug)
            .map((r) => (
              <Link
                key={r.slug}
                href={`/reparaties/${r.slug}`}
                className="inline-flex min-h-11 items-center text-cyan-300 underline"
              >
                {r.title}
              </Link>
            ))}
        </nav>
      </Container>
      <ClosingCta title="Kies je reparatie. Wij komen naar je toe." />
    </>
  );
}

async function RepairPrices({ match }: { match: string }) {
  return <RepairPriceList catalogue={await getCatalogue()} match={match} />;
}
