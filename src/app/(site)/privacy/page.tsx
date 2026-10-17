import { pageMetadata } from "@/components/site/seo";
import { getPublicSettings } from "@/components/site/data";
import { LegalList, LegalPage, todo } from "@/components/site/legal";

// The business name and contact details come from the database on each request.
export const instant = false;

export const metadata = pageMetadata("Privacyverklaring", "Lees welke gegevens 054repairs verwerkt voor je boeking en reparatie en hoe je contact opneemt over je privacy.", "/privacy");

export default async function PrivacyPage() {
  const settings = await getPublicSettings();
  const business = settings?.businessName ?? "[bedrijfsnaam]";
  const email = settings?.email ?? "[e-mailadres]";

  return (
    <LegalPage
      title="Privacyverklaring"
      lead="Welke gegevens we van je gebruiken, waarvoor, hoe lang we ze bewaren en welke rechten je hebt."
      articles={[
        {
          id: "verantwoordelijk",
          title: "1. Wie is verantwoordelijk",
          content: (
            <p>
              {todo(
                `${business} is verantwoordelijk voor de verwerking van persoonsgegevens die via deze website en bij een reparatie worden verzameld. Contact: ${email}.`,
              )}
            </p>
          ),
        },
        {
          id: "gegevens",
          title: "2. Welke gegevens we verwerken",
          content: (
            <LegalList
              items={[
                "Naam, telefoonnummer en e-mailadres.",
                "Het adres waar we de reparatie uitvoeren, en de coördinaten van dat adres om de afstand te berekenen.",
                "Het toestel en de gekozen reparatie.",
                "Opmerkingen die je bij je boeking invult.",
                "De betaalstatus van je boeking. Creditcard- en bankgegevens verwerkt de betaalprovider, niet wij.",
              ]}
            />
          ),
        },
        {
          id: "doelen",
          title: "3. Waarvoor we die gebruiken",
          content: (
            <LegalList
              items={[
                "Je boeking uitvoeren en de reparatie op je adres doen.",
                "Contact opnemen over je afspraak.",
                "De voorrijkosten berekenen.",
                "Betalingen verwerken.",
                "Onze administratie bijhouden en wettelijke verplichtingen nakomen.",
              ]}
            />
          ),
        },
        {
          id: "bewaren",
          title: "4. Hoe lang we gegevens bewaren",
          content: (
            <p>
              {todo(
                "Administratieve gegevens bewaren we [aantal] jaar, omdat de wet dat vereist. Andere gegevens bewaren we niet langer dan nodig is voor je boeking. [Bewaartermijnen controleren.]",
              )}
            </p>
          ),
        },
        {
          id: "delen",
          title: "5. Met wie we gegevens delen",
          content: (
            <p>
              {todo(
                "We gebruiken dienstverleners die namens ons gegevens verwerken, zoals de hostingpartij van onze database ([leverancier]) en de betaalprovider ([betaalprovider]). Met hen maken we afspraken over de beveiliging van je gegevens.",
              )}
            </p>
          ),
        },
        {
          id: "cookies",
          title: "6. Cookies",
          content: (
            <p>
              Op de openbare website plaatsen we geen tracking-cookies. Het beheer van de administratie gebruikt alleen
              technisch noodzakelijke cookies voor de inlog.
            </p>
          ),
        },
        {
          id: "metingen",
          title: "7. Boekingsmetingen en herinneringen",
          content: <p>Als boekingsmetingen zijn ingeschakeld, tellen we per dag hoe vaak een stap is bekeken en hoeveel boekingen en betalingen zijn verwerkt. Deze tellingen bevatten geen naam, adres, IP-adres, bezoeker-ID of persoonlijke statuslink. Als herinneringsmails zijn ingeschakeld, gebruiken we je e-mailadres om je aan een bevestigde afspraak te herinneren.</p>,
        },
        {
          id: "rechten",
          title: "8. Je rechten",
          content: (
            <p>
              {todo(
                `Je mag je gegevens inzien, laten corrigeren of laten verwijderen. Ook kun je bezwaar maken tegen de verwerking of om een kopie vragen. Stuur je verzoek naar ${email}. Je mag ook een klacht indienen bij de Autoriteit Persoonsgegevens.`,
              )}
            </p>
          ),
        },
        {
          id: "beveiliging",
          title: "9. Beveiliging",
          content: <p>Wij nemen passende technische en organisatorische maatregelen om je gegevens te beveiligen.</p>,
        },
      ]}
    />
  );
}
