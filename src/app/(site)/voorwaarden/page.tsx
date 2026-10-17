import { pageMetadata } from "@/components/site/seo";
import { getPublicSettings } from "@/components/site/data";
import { refundText, travelSummary } from "@/components/site/facts";
import { LegalPage, todo } from "@/components/site/legal";

// Business name, contact details and refund rules come from the database on each request.
export const instant = false;

export const metadata = pageMetadata(
  "Algemene voorwaarden",
  "Bekijk de voorwaarden voor het boeken en uitvoeren van een iPhone-reparatie bij 054repairs.",
  "/voorwaarden",
);

export default async function TermsPage() {
  const settings = await getPublicSettings();
  const business = settings?.businessName ?? "[bedrijfsnaam]";
  const email = settings?.email ?? "[e-mailadres]";
  const phone = settings?.phone ?? "[telefoonnummer]";
  const travel = settings ? travelSummary(settings) : null;

  return (
    <LegalPage
      title="Algemene voorwaarden"
      lead="De afspraken tussen jou en ons over boeken, betalen, annuleren en de reparatie zelf."
      articles={[
        {
          id: "wie-wij-zijn",
          title: "1. Wie wij zijn",
          content: (
            <>
              <p>
                {todo(
                  `${business} is gevestigd op [adres]. Wij zijn ingeschreven bij de Kamer van Koophandel onder nummer [KvK-nummer]. Ons btw-nummer is [btw-nummer].`,
                )}
              </p>
              <p>{todo(`Je kunt ons bereiken via ${email} of ${phone}.`)}</p>
            </>
          ),
        },
        {
          id: "dienst",
          title: "2. Onze dienst",
          content: (
            <p>
              Wij komen naar het adres dat de klant opgeeft en repareren het
              toestel op locatie. Zodra de reparatie klaar is, geven wij het
              toestel op dat adres terug.
            </p>
          ),
        },
        {
          id: "prijzen",
          title: "3. Prijzen en voorrijkosten",
          content: (
            <>
              <p>
                De reparatieprijs staat vast op het moment van boeken en is
                zichtbaar op de prijzenpagina. De voorrijkosten worden berekend
                op basis van de afstand tot ons vertrekpunt en worden apart
                vermeld.
              </p>
              <p>
                {travel
                  ? `${travel.free} ${travel.over} ${travel.max}`
                  : todo("[Voorrijkosten en afstandsgrenzen invullen.]")}
              </p>
            </>
          ),
        },
        {
          id: "boeking",
          title: "4. Boeking en betaling",
          content: (
            <>
              <p>
                Een boeking is definitief zodra de aanbetaling is ontvangen.
                Wordt de aanbetaling niet op tijd betaald, dan vervalt de
                boeking en komt het tijdstip weer vrij.
              </p>
              <p>
                {todo(
                  "Het restant betaal je bij teruggave met pin of contant, tenzij je al volledig hebt betaald. Online betalen verloopt via [betaalprovider].",
                )}
              </p>
            </>
          ),
        },
        {
          id: "annuleren",
          title: "5. Annuleren en terugbetaling",
          content: (
            <>
              <p>
                Je kunt een boeking annuleren tot het moment dat de afspraak
                begint, via je boekingspagina.
              </p>
              <p>
                {settings
                  ? refundText(settings)
                  : todo("[Terugbetalingsregels invullen.]")}
              </p>
            </>
          ),
        },
        {
          id: "garantie",
          title: "6. Garantie",
          content: (
            <p>
              {todo(
                "Op de uitgevoerde reparatie geldt een garantietermijn van [aantal maanden]. De garantie geldt niet voor schade die na de reparatie ontstaat door een andere oorzaak, zoals val- of waterschade.",
              )}
            </p>
          ),
        },
        {
          id: "aansprakelijkheid",
          title: "7. Aansprakelijkheid",
          content: (
            <p>
              Wij zijn niet aansprakelijk voor verlies van gegevens. Maak daarom
              vooraf altijd een back-up. Voor zover de wet dat toestaat, is onze
              aansprakelijkheid beperkt tot het bedrag van de betreffende
              reparatie.
            </p>
          ),
        },
        {
          id: "klachten",
          title: "8. Klachten en geschillen",
          content: (
            <p>
              {todo(
                `Een klacht kun je sturen naar ${email}. Wij zoeken samen naar een oplossing. Op deze voorwaarden en op elke overeenkomst met ons is Nederlands recht van toepassing.`,
              )}
            </p>
          ),
        },
      ]}
    />
  );
}
