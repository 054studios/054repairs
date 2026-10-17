import Link from "next/link";
import { Container, PageHeader } from "@/components/site/ui";
import { pageMetadata } from "@/components/site/seo";
import { h2Class } from "@/components/ui/styles";
export const metadata = pageMetadata(
  "Over 054repairs",
  "054repairs repareert iPhones op locatie in regio Amsterdam. Lees hoe we werken en wat je vooraf van ons kunt verwachten.",
  "/over-ons",
);
export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="De reparatie komt naar jou."
        lead="054repairs is een mobiele reparatieservice voor iPhones. Wij rijden naar je toe en repareren je toestel ter plekke in onze bus."
      />
      <Container className="grid gap-10 pb-20 md:grid-cols-2">
        <section>
          <h2 className={h2Class}>Duidelijkheid voor je boekt</h2>
          <p className="mt-5 max-w-[55ch] leading-relaxed text-steel-300">
            Je kiest zelf je model, reparatie en onderdeelkwaliteit. Je ziet
            vooraf de reparatieprijs en duur. Eventuele voorrijkosten berekenen
            we op basis van je adres voordat je betaalt.
          </p>
          <Link
            href="/prijzen"
            className="mt-4 inline-flex min-h-11 items-center text-cyan-300 underline"
          >
            Bekijk prijzen en kwaliteiten →
          </Link>
        </section>
        <section>
          <h2 className={h2Class}>Bij jou in de buurt</h2>
          <p className="mt-5 max-w-[55ch] leading-relaxed text-steel-300">
            We werken in regio Amsterdam en omgeving. Je geeft je iPhone op het
            afgesproken tijdstip aan ons en krijgt hem na de reparatie weer
            terug. Je afspraak volg je via een persoonlijke statuslink.
          </p>
          <Link
            href="/werkgebied"
            className="mt-4 inline-flex min-h-11 items-center text-cyan-300 underline"
          >
            Controleer je adres →
          </Link>
        </section>
        <section>
          <h2 className={h2Class}>Vragen over je toestel?</h2>
          <p className="mt-5 max-w-[55ch] leading-relaxed text-steel-300">
            Weet je niet welke reparatie nodig is of wil je meer weten over een
            onderdeel? Neem voor je boekt contact op. Deel je toegangscode of
            wachtwoord nooit via een bericht.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-flex min-h-11 items-center text-cyan-300 underline"
          >
            Neem contact op →
          </Link>
        </section>
      </Container>
    </>
  );
}
