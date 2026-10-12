import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { getCatalogue, getPublicSettings, durationRange } from "@/components/site/data";
import { depositPhrase, refundText, travelSummary } from "@/components/site/facts";
import { ServiceRoute, type ServiceStop } from "@/components/site/service-route";
import { ClosingCta, Container, PageHeader } from "@/components/site/ui";
import { displayClass, textLinkClass } from "@/components/ui/styles";

// The booking details, deposit text and durations come from the database on each request.
export const instant = false;

export const metadata: Metadata = {
  title: "Hoe het werkt",
  description:
    "Van je boeking tot je iPhone weer in je hand ligt. Wij rijden naar je toe en repareren ter plekke in onze bus.",
};

export default async function HowItWorksPage() {
  const [settings, catalogue] = await Promise.all([getPublicSettings(), getCatalogue()]);
  const travel = settings ? travelSummary(settings) : null;
  const range = catalogue ? durationRange(catalogue) : null;

  const stops: ServiceStop[] = [
    {
      scene: "boeken",
      title: "Je boekt online",
      body: (
        <>
          <p>
            Kies je model, de reparatie en de kwaliteit. Je ziet meteen de vaste prijs en hoe lang de reparatie duurt.
          </p>
          <p>
            Daarna kies je een vrij tijdstip en vul je je adres in, zodat we de voorrijkosten kunnen berekenen.
            {settings ? ` Je boekt minimaal ${settings.bookingLeadHours} uur vooruit.` : null}
          </p>
          <p>
            Met de aanbetaling leg je het tijdstip vast. Betaal je niet op tijd, dan vervalt de boeking en komt het
            tijdstip weer vrij.
          </p>
        </>
      ),
      fact: settings ? `Aanbetaling: ${depositPhrase(settings)}` : undefined,
    },
    {
      scene: "rijden",
      title: "Wij rijden naar je toe",
      body: (
        <>
          <p>Op het afgesproken tijdstip rijden we met de bus naar het adres dat je hebt opgegeven.</p>
          <p>
            {travel
              ? `${travel.free} ${travel.over} ${travel.max}`
              : "De voorrijkosten hangen af van de afstand tot je adres. Je ziet het bedrag voordat je betaalt."}
          </p>
        </>
      ),
      fact: travel?.example ?? undefined,
    },
    {
      scene: "repareren",
      title: "Reparatie in de bus",
      body: (
        <>
          <p>
            We repareren je iPhone ter plekke, in onze bus. Je toestel gaat dus niet mee naar een werkplaats, het blijft
            bij jou in de buurt.
          </p>
          <p>De duur van je reparatie staat bij de prijs en in je boeking. Zo lang duurt ook je afspraak.</p>
        </>
      ),
      fact: range
        ? range.min === range.max
          ? `Duur: ${range.min} minuten`
          : `Duur: ${range.min} tot ${range.max} minuten, per reparatie`
        : undefined,
    },
    {
      scene: "terug",
      title: "Terug bij jou",
      body: (
        <p>
          Zodra de reparatie klaar is, krijg je je iPhone terug. Het restbedrag betaal je dan met pin of contant, tenzij
          je al alles vooraf hebt betaald.
        </p>
      ),
      fact: "Restbedrag met pin of contant",
    },
  ];

  return (
    <>
      <PageHeader
        title="Hoe het werkt"
        lead="Van je boeking tot het moment dat je iPhone weer in je hand ligt. Dit gebeurt er bij elke stop."
      />

      <Container className="pb-8 pt-4 md:pt-8">
        <ServiceRoute stops={stops} headingLevel={2} />
      </Container>

      <Container className="py-16 md:py-24">
        <div className="divide-y divide-line border-y border-line">
          <Practical id="klaarzetten" title="Wat je klaarzet">
            <ul className="space-y-3">
              <li>
                Een back-up van je iPhone. Bij een reparatie kunnen gegevens verloren gaan, ook als we zorgvuldig
                werken.
              </li>
              <li>
                Een plek bij je adres waar de bus kan staan. Is parkeren lastig, zet het dan bij de opmerkingen in je
                boeking.
              </li>
              <li>Deel je pincode of wachtwoord nooit per e-mail of via een bericht.</li>
            </ul>
          </Practical>

          <Practical id="onderdeel" title="Als een onderdeel niet beschikbaar is">
            <p>
              Soms is een onderdeel voor jouw model tijdelijk niet leverbaar. Dan nemen we contact met je op voordat we
              naar je toe rijden, en overleggen we hoe we verder gaan, bijvoorbeeld met een nieuw tijdstip.
            </p>
          </Practical>

          <Practical id="betalen" title="Betalen en annuleren">
            <p>
              {settings
                ? `Bij het boeken betaal je ${depositPhrase(settings)} online.`
                : "Bij het boeken betaal je een aanbetaling online."}{" "}
              Het restbedrag betaal je bij teruggave met pin of contant.
              {settings?.allowFullPrepay ? " Je kunt ook meteen het hele bedrag online betalen." : null}
            </p>
            <p>
              Annuleren kan tot het moment dat je afspraak begint, via je boekingspagina.{" "}
              {settings ? refundText(settings) : "Hoeveel je terugkrijgt, hangt af van het moment van annuleren."}
            </p>
            <p>
              <Link href="/voorwaarden" className={`${textLinkClass} inline-flex min-h-11 items-center`}>
                Lees de voorwaarden
              </Link>
            </p>
          </Practical>
        </div>
      </Container>

      <ClosingCta title="Klaar om te boeken?">
        <p>
          Kies je reparatie en een tijdstip. Nog een vraag? Bekijk de{" "}
          <Link href="/faq" className={textLinkClass}>
            veelgestelde vragen
          </Link>
          .
        </p>
      </ClosingCta>
    </>
  );
}

function Practical({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-titel`} className="grid gap-4 py-10 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:gap-12 md:py-12">
      <h2 id={`${id}-titel`} className={`${displayClass} text-[clamp(1.5rem,2.6vw,2rem)] leading-[1.12]`}>
        {title}
      </h2>
      <div className="max-w-[60ch] space-y-4 text-base leading-relaxed text-steel-300 md:text-[1.0625rem]">
        {children}
      </div>
    </section>
  );
}
