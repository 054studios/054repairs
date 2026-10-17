import { RealWork } from "@/components/site/real-work";
import Link from "next/link";
import Image from "next/image";
import phoneRepair from "@/assets/landing/phone-repair.webp";
import repairAtHome from "@/assets/landing/repair-at-home.webp";
import { pageMetadata } from "@/components/site/seo";
import { repairPages } from "@/components/site/repair-content";
export const metadata = pageMetadata(
  "iPhone-reparatie aan huis in regio Amsterdam",
  "Laat je iPhone op locatie repareren door 054repairs. Bekijk prijzen voor scherm, batterij en laadpoort en controleer de voorrijkosten.",
  "/",
);
import { Suspense, type CSSProperties } from "react";
import {
  PriceCheckSkeleton,
  HomeSectionsSkeleton,
} from "@/components/site/loading-skeletons";
import {
  getCatalogue,
  getPublicSettings,
  type PublicSettings,
} from "@/components/site/data";
import {
  durationRangeOf,
  fromPriceTable,
  pricedCatalogue,
  type FromPriceTable,
  type PricedCatalogue,
} from "@/components/site/catalogue";
import {
  depositPhrase,
  refundText,
  travelSummary,
} from "@/components/site/facts";
import { buildFaq, type FaqItem } from "@/components/site/faq-items";
import { FaqList } from "@/components/site/faq-list";
import { PriceCheck } from "@/components/site/price-check";
import {
  ServiceRoute,
  type ServiceStop,
} from "@/components/site/service-route";
import { TravelFee } from "@/components/site/travel-fee";
import { ClosingCta, Container, Notice } from "@/components/site/ui";
import {
  displayClass,
  h2Class,
  h3Class,
  leadClass,
  textLinkClass,
} from "@/components/ui/styles";
import { formatEuro } from "@/lib/money";

// Prices and settings are read from the database on each request.
export const instant = false;

const HOME_FAQ = ["werkwijze", "duur", "onderdeel", "backup"];

const stagger = (index: number) => ({ "--i": index }) as CSSProperties;

export default function HomePage() {
  return (
    <>
      <Hero />
      <Container className="py-8">
        <nav
          aria-label="Kies je reparatie"
          className="flex flex-wrap gap-x-6 gap-y-2"
        >
          {repairPages.map((r) => (
            <Link
              key={r.slug}
              href={`/reparaties/${r.slug}`}
              className="inline-flex min-h-11 items-center text-cyan-300 underline underline-offset-4"
            >
              {r.title}
            </Link>
          ))}
          <Link
            href="/werkgebied"
            className="inline-flex min-h-11 items-center text-cyan-300 underline underline-offset-4"
          >
            Check je postcode →
          </Link>
        </nav>
      </Container>
      <Suspense fallback={<HomeSectionsSkeleton />}>
        <HomeSections />
      </Suspense>
    </>
  );
}
async function HomePriceCheck() {
  const [settings, catalogue] = await Promise.all([
    getPublicSettings(),
    getCatalogue(),
  ]);
  return (
    <PriceCheck
      catalogue={catalogue ? pricedCatalogue(catalogue) : null}
      freeTravelKm={settings?.freeTravelKm ?? null}
    />
  );
}
async function HomeSections() {
  const [settings, catalogue] = await Promise.all([
    getPublicSettings(),
    getCatalogue(),
  ]);
  const priced = catalogue ? pricedCatalogue(catalogue) : null;
  const allFaq = buildFaq(settings, catalogue);
  const faq = HOME_FAQ.flatMap((id) => allFaq.filter((item) => item.id === id));
  return (
    <>
      <RouteSection priced={priced} settings={settings} />
      <TravelSection settings={settings} />
      <PricePreview table={priced ? fromPriceTable(priced) : null} />
      <PaymentSection settings={settings} />
      <RealWork />
      <FaqSection items={faq} />
      <ClosingCta title="Jij kiest het moment. Wij rijden naar je toe." />
    </>
  );
}

function Hero() {
  return (
    <section aria-labelledby="hero-titel" className="night-sky">
      <Container className="grid gap-7 pb-16 pt-7 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-x-14 lg:gap-y-8 lg:pb-28 lg:pt-20">
        <div>
          {/* No entrance animation on the headline: it is the largest paint and must show at once. */}
          <h1
            id="hero-titel"
            className={`${displayClass} max-w-[14ch] text-[clamp(2.5rem,6.2vw,5rem)] leading-[0.98] tracking-[-0.035em]`}
          >
            <span className="whitespace-nowrap">iPhone-reparatie</span> voor de
            deur.
          </h1>
          <p
            className="settle mt-4 max-w-[38ch] text-[1.0625rem] leading-relaxed text-steel-300 sm:mt-6 sm:text-xl"
            style={stagger(1)}
          >
            Wij rijden naar je toe en repareren je iPhone op locatie. Zodra de
            reparatie klaar is, heb je hem terug.
          </p>
        </div>

        <div
          className="settle lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center"
          style={stagger(2)}
        >
          <Suspense fallback={<PriceCheckSkeleton />}>
            <HomePriceCheck />
          </Suspense>
        </div>
        <figure className="relative lg:col-start-1 lg:row-start-2">
          <div className="relative aspect-[3/2] sm:aspect-[2/1] lg:aspect-[16/9]">
            <Image
              src={phoneRepair}
              alt="Smartphone met losgemaakt scherm en precisiegereedschap."
              fill
              sizes="(min-width: 1216px) 680px, (min-width: 1024px) calc(100vw - 33rem), (min-width: 640px) calc(100vw - 3rem), calc(100vw - 2rem)"
              placeholder="blur"
              loading="eager"
              className="landing-visual object-cover"
            />
          </div>
        </figure>
      </Container>
    </section>
  );
}

function RouteSection({
  priced,
  settings,
}: {
  priced: PricedCatalogue | null;
  settings: PublicSettings | null;
}) {
  const range = priced ? durationRangeOf(priced) : null;
  const travel = settings ? travelSummary(settings) : null;

  const stops: ServiceStop[] = [
    {
      scene: "boeken",
      title: "Je boekt online",
      body: (
        <p>
          Kies je model en de reparatie. Je ziet de prijs vooraf en legt je
          tijdstip vast met een aanbetaling.
        </p>
      ),
      fact: settings
        ? `Aanbetaling: ${depositPhrase(settings)}`
        : "Prijs vooraf, aanbetaling online",
    },
    {
      scene: "rijden",
      title: "Wij rijden naar je toe",
      body: (
        <p>
          Je geeft je adres op. Op het afgesproken tijdstip zijn we bij jou voor
          de deur.
        </p>
      ),
      fact: travel
        ? travel.freeKm
          ? `Voorrijkosten pas boven ${travel.freeKm} km`
          : `Voorrijkosten ${travel.perKm} per km`
        : "Voorrijkosten zie je bij het boeken",
    },
    {
      scene: "repareren",
      title: "Reparatie op locatie",
      body: (
        <p>
          We repareren je iPhone op locatie. Hoe lang dat duurt, hangt af van de
          reparatie en zie je al bij de prijs.
        </p>
      ),
      fact: range
        ? range.min === range.max
          ? `Duur: ${range.min} minuten`
          : `Duur: ${range.min} tot ${range.max} minuten`
        : undefined,
    },
    {
      scene: "terug",
      title: "Terug bij jou",
      body: (
        <p>
          Zodra de reparatie klaar is, krijg je je iPhone terug. Dan betaal je
          het restbedrag.
        </p>
      ),
      fact: "Restbedrag met pin of contant",
    },
  ];

  return (
    <section
      aria-labelledby="route-titel"
      className="reveal-on-scroll pb-16 pt-8 md:pb-24 md:pt-12"
    >
      <Container>
        <h2 id="route-titel" className={`${h2Class} max-w-[16ch]`}>
          Van boeking tot terug in je hand
        </h2>
        <div className="mt-12 md:mt-16">
          <ServiceRoute stops={stops} />
        </div>
      </Container>
    </section>
  );
}

function TravelSection({ settings }: { settings: PublicSettings | null }) {
  const travel = settings ? travelSummary(settings) : null;
  return (
    <section
      aria-labelledby="voorrijkosten-titel"
      className="reveal-on-scroll py-16 md:py-24"
    >
      <Container className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12">
        <div className="min-w-0">
          <h2 id="voorrijkosten-titel" className={h2Class}>
            Voorrijkosten, vooraf duidelijk
          </h2>
          <p className={"mt-4 " + leadClass}>
            {travel
              ? travel.free +
                " " +
                travel.over +
                " Schuif naar jouw afstand en zie wat het kost."
              : "De voorrijkosten hangen af van de afstand tot je adres. Je ziet het bedrag voordat je betaalt."}
          </p>
          {settings ? (
            <div className="mt-8">
              <TravelFee
                rule={{
                  freeTravelKm: settings.freeTravelKm,
                  pricePerKmCents: settings.pricePerKmCents,
                  travelDistanceMode: settings.travelDistanceMode,
                }}
                maxTravelKm={settings.maxTravelKm}
              />
            </div>
          ) : null}
        </div>
        <figure className="relative min-w-0">
          <Image
            src={repairAtHome}
            alt="Een smartphone wordt met precisiegereedschap gerepareerd."
            sizes="(min-width: 1216px) 480px, (min-width: 1024px) 42vw, (min-width: 640px) calc(100vw - 3rem), calc(100vw - 2rem)"
            placeholder="blur"
            className="landing-visual aspect-[4/3] w-full object-cover lg:aspect-[4/5]"
          />
        </figure>
      </Container>
    </section>
  );
}

function PricePreview({ table }: { table: FromPriceTable | null }) {
  return (
    <section
      aria-labelledby="prijzen-titel"
      className="reveal-on-scroll py-16 md:py-24"
    >
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-[52ch]">
            <h2 id="prijzen-titel" className={h2Class}>
              Vaste prijzen per model
            </h2>
            <p className={`mt-4 ${leadClass}`}>
              De reparatieprijs staat vast voordat je boekt.
            </p>
          </div>
          <Link
            href="/prijzen"
            className={`${textLinkClass} inline-flex min-h-11 items-center self-start sm:self-auto`}
          >
            Bekijk alle prijzen
          </Link>
        </div>

        <div className="mt-10">
          {table ? (
            <div className="overflow-hidden rounded-panel bg-ink-900 shadow-panel ring-1 ring-line">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">
                  Vanaf-prijs per model voor de meest gevraagde reparaties
                </caption>
                <thead>
                  <tr className="border-b border-line-strong">
                    <th
                      scope="col"
                      className="px-4 py-3.5 text-sm font-medium text-steel-400 sm:px-6"
                    >
                      Model
                    </th>
                    {table.repairs.map((repair) => (
                      <th
                        key={repair.id}
                        scope="col"
                        className="px-4 py-3.5 text-right text-sm font-medium text-steel-400 sm:px-6"
                      >
                        {repair.name}
                        <span className="block text-xs font-normal text-steel-500">
                          vanaf
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {table.rows.map((row) => (
                    <tr key={row.model.id}>
                      <th
                        scope="row"
                        className="px-4 py-3.5 font-medium text-steel-100 sm:px-6"
                      >
                        {row.model.name}
                      </th>
                      {row.from.map((cents, index) => (
                        <td
                          key={table.repairs[index].id}
                          className="figures whitespace-nowrap px-4 py-3.5 text-right text-steel-50 sm:px-6"
                        >
                          {cents === null ? (
                            <span className="text-steel-500">
                              <span aria-hidden="true">-</span>
                              <span className="sr-only">Niet beschikbaar</span>
                            </span>
                          ) : (
                            formatEuro(cents)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Notice>
              De prijzen zijn nu niet te laden. Bij het boeken zie je de prijs
              voordat je iets betaalt.
            </Notice>
          )}
        </div>
      </Container>
    </section>
  );
}

function PaymentSection({ settings }: { settings: PublicSettings | null }) {
  return (
    <section
      aria-labelledby="betalen-titel"
      className="reveal-on-scroll py-16 md:py-24"
    >
      <Container>
        <h2 id="betalen-titel" className={h2Class}>
          Betalen en annuleren
        </h2>

        <div className="mt-10 grid gap-x-16 gap-y-10 border-t border-line pt-10 md:grid-cols-2">
          <div className="space-y-8">
            <div>
              <h3 className={h3Class}>Aanbetaling bij het boeken</h3>
              <p className="mt-2 max-w-[48ch] leading-relaxed text-steel-400">
                {settings
                  ? `Je betaalt ${depositPhrase(settings)} online. Daarmee ligt je tijdstip vast.`
                  : "Je betaalt een aanbetaling online. Daarmee ligt je tijdstip vast."}
                {settings?.allowFullPrepay
                  ? " Je kunt ook meteen het hele bedrag betalen."
                  : null}
              </p>
            </div>
            <div>
              <h3 className={h3Class}>Restbedrag bij teruggave</h3>
              <p className="mt-2 max-w-[48ch] leading-relaxed text-steel-400">
                Het restbedrag betaal je als je je iPhone terugkrijgt, met pin
                of contant.
              </p>
            </div>
          </div>
          <div>
            <h3 className={h3Class}>Annuleren</h3>
            <p className="mt-2 max-w-[48ch] leading-relaxed text-steel-400">
              Je kunt annuleren tot het moment dat je afspraak begint, via je
              boekingspagina.{" "}
              {settings
                ? refundText(settings)
                : "Hoeveel je terugkrijgt, hangt af van het moment van annuleren."}
            </p>
            <p className="mt-4">
              <Link
                href="/voorwaarden"
                className={`${textLinkClass} inline-flex min-h-11 items-center`}
              >
                Lees de voorwaarden
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function FaqSection({ items }: { items: FaqItem[] }) {
  return (
    <section
      aria-labelledby="vragen-titel"
      className="reveal-on-scroll py-16 md:py-24"
    >
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-16">
        <div>
          <h2 id="vragen-titel" className={h2Class}>
            Vragen
          </h2>
          <p className={`mt-4 max-w-[36ch] ${leadClass}`}>
            Staat je vraag er niet bij? Bekijk alle vragen of neem contact op.
          </p>
          <p className="mt-6 flex flex-wrap gap-x-6">
            <Link
              href="/faq"
              className={`${textLinkClass} inline-flex min-h-11 items-center`}
            >
              Alle vragen
            </Link>
            <Link
              href="/contact"
              className={`${textLinkClass} inline-flex min-h-11 items-center`}
            >
              Contact
            </Link>
          </p>
        </div>
        <FaqList items={items} groupName="faq-home" />
      </Container>
    </section>
  );
}
