import Link from "next/link";
import { getPublicSettings } from "@/components/site/data";
import { travelSummary } from "@/components/site/facts";
import { AreaCheck } from "@/components/site/area-check";
import { pageMetadata } from "@/components/site/seo";
import { Container, PageHeader } from "@/components/site/ui";
import { h2Class } from "@/components/ui/styles";
export const metadata = pageMetadata(
  "iPhone-reparatie aan huis in regio Amsterdam",
  "Controleer of 054repairs naar je adres komt en bekijk de voorrijkosten voor een iPhone-reparatie op locatie.",
  "/werkgebied",
);
export default async function AreaPage() {
  const settings = await getPublicSettings();
  const travel = settings ? travelSummary(settings) : null;
  return (
    <>
      <PageHeader
        title="Komen wij ook naar jou toe?"
        lead="Wij werken op locatie in regio Amsterdam en omgeving. Controleer je adres voor de beschikbaarheid van onze service en de voorrijkosten."
      />
      <Container className="grid gap-10 pb-20 lg:grid-cols-2">
        <section aria-labelledby="area-title">
          <h2 id="area-title" className={h2Class}>
            Check je adres
          </h2>
          <div className="mt-6">
            <AreaCheck />
          </div>
        </section>
        <section className="max-w-[55ch]">
          <h2 className={h2Class}>Vooraf duidelijk wat het kost</h2>
          <p className="mt-5 leading-relaxed text-steel-300">
            {travel
              ? [travel.free, travel.over, travel.max].join(" ")
              : "De voorrijkosten hangen af van de afstand tot je adres. De actuele kosten zie je bij het boeken."}
          </p>
          <p className="mt-5 leading-relaxed text-steel-400">
            De afstand wordt berekend vanaf ons vertrekpunt. Een plaatsnaam
            alleen is daarom geen garantie: controleer je eigen adres. We
            repareren op locatie; je hoeft niet naar een winkel te reizen.
          </p>
          <Link
            href="/hoe-het-werkt"
            className="mt-5 inline-flex min-h-11 items-center text-cyan-300 underline"
          >
            Bekijk hoe het werkt →
          </Link>
        </section>
      </Container>
    </>
  );
}
