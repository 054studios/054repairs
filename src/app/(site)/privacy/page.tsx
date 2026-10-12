import type { Metadata } from "next";
import { getPublicSettings } from "@/components/site/data";
import { Container, Notice, PageHeader } from "@/components/site/ui";

// The business name and contact details come from the database on each request.
export const instant = false;

export const metadata: Metadata = {
  title: "Privacyverklaring",
  description: "Welke persoonsgegevens we verwerken, waarom, hoe lang en welke rechten je hebt.",
};

export default async function PrivacyPage() {
  const settings = await getPublicSettings();
  const business = settings?.businessName ?? "[bedrijfsnaam]";
  const email = settings?.email ?? "[e-mailadres]";

  return (
    <>
      <PageHeader title="Privacyverklaring" />

      <Container className="pb-24">
        <div className="max-w-[70ch] space-y-10 leading-relaxed text-navy-800">
          <Notice tone="note">
            Concept. Laat deze tekst controleren door een jurist voordat de website live gaat. Vervang alle tekst tussen
            [haakjes] door je eigen gegevens.
          </Notice>

          <Article title="1. Wie is verantwoordelijk">
            <p>
              {business} is verantwoordelijk voor de verwerking van persoonsgegevens die via deze website en bij een
              reparatie worden verzameld. Contact: {email}.
            </p>
          </Article>

          <Article title="2. Welke gegevens we verwerken">
            <ul className="list-disc space-y-2 pl-5">
              <li>Naam, telefoonnummer en e-mailadres.</li>
              <li>Het adres waar we het toestel ophalen en terugbrengen, en de coördinaten van dat adres om de afstand te berekenen.</li>
              <li>Het toestel en de gekozen reparatie.</li>
              <li>Opmerkingen die je bij je boeking invult.</li>
              <li>De betaalstatus van je boeking. Creditcard- en bankgegevens verwerkt de betaalprovider, niet wij.</li>
            </ul>
          </Article>

          <Article title="3. Waarvoor we die gebruiken">
            <ul className="list-disc space-y-2 pl-5">
              <li>Je boeking uitvoeren en het toestel ophalen en terugbrengen.</li>
              <li>Contact opnemen over je afspraak.</li>
              <li>De voorrijkosten berekenen.</li>
              <li>Betalingen verwerken.</li>
              <li>Onze administratie bijhouden en wettelijke verplichtingen nakomen.</li>
            </ul>
          </Article>

          <Article title="4. Hoe lang we gegevens bewaren">
            <p>
              Administratieve gegevens bewaren we [aantal] jaar, omdat de wet dat vereist. Andere gegevens bewaren we niet
              langer dan nodig is voor je boeking. [Bewaartermijnen controleren.]
            </p>
          </Article>

          <Article title="5. Met wie we gegevens delen">
            <p>
              We gebruiken dienstverleners die namens ons gegevens verwerken, zoals de hostingpartij van onze database
              ([leverancier]) en de betaalprovider ([betaalprovider]). Met hen maken we afspraken over de beveiliging van je
              gegevens.
            </p>
          </Article>

          <Article title="6. Cookies">
            <p>
              Op de openbare website plaatsen we geen tracking-cookies. Het beheer van de administratie gebruikt alleen
              technisch noodzakelijke cookies voor de inlog.
            </p>
          </Article>

          <Article title="7. Je rechten">
            <p>
              Je mag je gegevens inzien, laten corrigeren of laten verwijderen. Ook kun je bezwaar maken tegen de
              verwerking of om een kopie vragen. Stuur je verzoek naar {email}. Je mag ook een klacht indienen bij de
              Autoriteit Persoonsgegevens.
            </p>
          </Article>

          <Article title="8. Beveiliging">
            <p>
              Wij nemen passende technische en organisatorische maatregelen om je gegevens te beveiligen.
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
