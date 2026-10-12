import type { Metadata } from "next";
import { getPublicSettings } from "@/components/site/data";
import { refundText, travelSummary } from "@/components/site/facts";
import { Container, Notice, PageHeader } from "@/components/site/ui";

// Business name, contact details and refund rules come from the database on each request.
export const instant = false;

export const metadata: Metadata = {
  title: "Algemene voorwaarden",
  description: "De algemene voorwaarden voor reparaties en boekingen.",
};

export default async function TermsPage() {
  const settings = await getPublicSettings();
  const business = settings?.businessName ?? "[bedrijfsnaam]";
  const email = settings?.email ?? "[e-mailadres]";
  const phone = settings?.phone ?? "[telefoonnummer]";
  const travel = settings ? travelSummary(settings) : null;

  return (
    <>
      <PageHeader title="Algemene voorwaarden" />

      <Container className="pb-24">
        <div className="max-w-[70ch] space-y-10 leading-relaxed text-navy-800">
          <Notice tone="note">
            Concept. Laat deze tekst controleren door een jurist voordat de website live gaat. Vervang alle tekst tussen
            [haakjes] door je eigen gegevens.
          </Notice>

          <Article title="1. Wie wij zijn">
            <p>
              {business} is gevestigd op [adres]. Wij zijn ingeschreven bij de Kamer van Koophandel onder nummer
              [KvK-nummer]. Ons btw-nummer is [btw-nummer].
            </p>
            <p>
              Je kunt ons bereiken via {email} of {phone}.
            </p>
          </Article>

          <Article title="2. Onze dienst">
            <p>
              Wij halen een toestel op bij het adres dat de klant opgeeft, repareren het en brengen het terug naar dat
              adres.
            </p>
          </Article>

          <Article title="3. Prijzen en voorrijkosten">
            <p>
              De reparatieprijs staat vast op het moment van boeken en is zichtbaar op de prijzenpagina. De voorrijkosten
              worden berekend op basis van de afstand tot ons vertrekpunt en worden apart vermeld.
            </p>
            <p>
              {travel
                ? `${travel.free} ${travel.over} ${travel.max}`
                : "[Voorrijkosten en afstandsgrenzen invullen.]"}
            </p>
          </Article>

          <Article title="4. Boeking en betaling">
            <p>
              Een boeking is definitief zodra de aanbetaling is ontvangen. Wordt de aanbetaling niet op tijd betaald, dan
              vervalt de boeking en komt het tijdstip weer vrij.
            </p>
            <p>
              Het restant betaal je bij terugbrengen met pin of contant, tenzij je al volledig hebt betaald. Online betalen
              verloopt via [betaalprovider].
            </p>
          </Article>

          <Article title="5. Annuleren en terugbetaling">
            <p>
              Je kunt een boeking annuleren tot het moment dat de afspraak begint, via je boekingspagina.
            </p>
            <p>{settings ? refundText(settings) : "[Terugbetalingsregels invullen.]"}</p>
          </Article>

          <Article title="6. Garantie">
            <p>
              Op de uitgevoerde reparatie geldt een garantietermijn van [aantal maanden]. De garantie geldt niet voor
              schade die na de reparatie ontstaat door een andere oorzaak, zoals val- of waterschade.
            </p>
          </Article>

          <Article title="7. Aansprakelijkheid">
            <p>
              Wij zijn niet aansprakelijk voor verlies van gegevens. Maak daarom vooraf altijd een back-up. Voor zover de
              wet dat toestaat, is onze aansprakelijkheid beperkt tot het bedrag van de betreffende reparatie.
            </p>
          </Article>

          <Article title="8. Klachten en geschillen">
            <p>
              Een klacht kun je sturen naar {email}. Wij zoeken samen naar een oplossing. Op deze voorwaarden en op elke
              overeenkomst met ons is Nederlands recht van toepassing.
            </p>
          </Article>
        </div>
      </Container>
    </>
  );
}

function Article({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold tracking-[-0.01em] text-navy-950">{title}</h2>
      {children}
    </section>
  );
}
