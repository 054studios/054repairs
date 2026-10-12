import Link from "next/link";
import { buttonClass, textLinkClass } from "@/components/site/button";
import { getCatalogue, getPublicSettings, summarizeRepairs, type PublicSettings } from "@/components/site/data";
import { depositPhrase, phoneHref, travelSummary } from "@/components/site/facts";
import { buildFaq } from "@/components/site/faq-items";
import { FaqList } from "@/components/site/faq-list";
import { Container, Notice } from "@/components/site/ui";
import { formatEuro } from "@/lib/money";

const steps = [
  {
    title: "Boek online",
    text: "Kies je toestel, de reparatie en een moment dat je uitkomt.",
  },
  {
    title: "Wij halen het op",
    text: "Op het afgesproken moment halen we je toestel bij je op.",
  },
  {
    title: "Wij repareren",
    text: "We repareren je toestel. De duur staat in je boeking.",
  },
  {
    title: "Terug bij jou",
    text: "Uiterlijk op het eindtijdstip van je boeking brengen we je toestel terug.",
  },
];

// Prices and settings are read from the database on each request.
export const instant = false;

export default async function HomePage() {
  const [settings, catalogue] = await Promise.all([getPublicSettings(), getCatalogue()]);
  const repairs = catalogue ? summarizeRepairs(catalogue) : null;
  const faq = buildFaq(settings, catalogue).filter((item) =>
    ["voorrijkosten", "betaling", "annuleren"].includes(item.id),
  );

  return (
    <>
      <Hero settings={settings} />
      <Steps />
      <PriceTeaser repairs={repairs} />
      <Trust settings={settings} />
      <FaqTeaser items={faq} />
      <ClosingCta settings={settings} />
    </>
  );
}

function Hero({ settings }: { settings: PublicSettings | null }) {
  return (
    <section aria-labelledby="hero-titel" className="pb-20 pt-12 md:pb-28 md:pt-20">
      <Container className="grid items-end gap-14 lg:grid-cols-[1.3fr_0.7fr] lg:gap-16">
        <div>
          <h1
            id="hero-titel"
            className="rise text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.03em] text-navy-950 sm:text-6xl lg:text-[3.5rem]"
          >
            Je telefoon repareren, zonder de deur uit.
          </h1>
          <p className="rise rise-2 mt-6 max-w-[34ch] text-lg leading-relaxed text-navy-800 md:text-xl">
            Wij halen je toestel op, repareren het en brengen het terug. Betaal een aanbetaling of alles in één keer.
          </p>
          <div className="rise rise-3 mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link href="/boeken" className={buttonClass("primary")}>
              Boek een reparatie
            </Link>
            <Link href="/prijzen" className={textLinkClass}>
              Bekijk de prijzen
            </Link>
          </div>
        </div>

        <TravelCard settings={settings} />
      </Container>
    </section>
  );
}

function TravelCard({ settings }: { settings: PublicSettings | null }) {
  return (
    <section
      aria-labelledby="voorrijkosten-titel"
      className="rise rise-3 rounded-3xl bg-white p-6 ring-1 ring-navy-100 shadow-[0_1px_0_rgba(11,27,51,0.04),0_32px_56px_-32px_rgba(11,27,51,0.3)] md:p-8"
    >
      <h2 id="voorrijkosten-titel" className="text-base font-semibold text-navy-700">
        Voorrijkosten
      </h2>

      {settings ? (
        <TravelFacts settings={settings} />
      ) : (
        <p className="mt-4 text-lg leading-relaxed text-navy-900">
          De voorrijkosten hangen af van de afstand tot je adres. Je ziet het bedrag voordat je boekt.
        </p>
      )}
    </section>
  );
}

function TravelFacts({ settings }: { settings: PublicSettings }) {
  const travel = travelSummary(settings);

  return (
    <>
      <p className="mt-3 text-6xl font-extrabold tracking-[-0.03em] text-navy-950">
        {travel.freeKm ? `${travel.freeKm} km` : "0 km"}
      </p>
      <p className="mt-2 text-lg text-navy-900">{travel.freeKm ? "afstand gratis" : "geen gratis kilometers"}</p>

      <dl className="mt-8 space-y-5 border-t border-navy-100 pt-6 text-base">
        <div>
          <dt className="font-semibold text-navy-950">Daarboven</dt>
          <dd className="mt-1 text-navy-800">{travel.over}</dd>
        </div>
        {travel.example ? (
          <div>
            <dt className="font-semibold text-navy-950">Voorbeeld</dt>
            <dd className="mt-1 text-navy-800">{travel.example}</dd>
          </div>
        ) : null}
        <div>
          <dt className="font-semibold text-navy-950">Maximale afstand</dt>
          <dd className="mt-1 text-navy-800">{travel.maxKm} km vanaf ons vertrekpunt</dd>
        </div>
      </dl>
    </>
  );
}

function Steps() {
  return (
    <section aria-labelledby="stappen-titel" className="py-16 md:py-24">
      <Container>
        <h2
          id="stappen-titel"
          className="max-w-[20ch] text-3xl font-extrabold leading-tight tracking-[-0.02em] text-navy-950 md:text-4xl"
        >
          Zo werkt het in vier stappen
        </h2>

        <ol className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {steps.map((step, index) => (
            <li key={step.title}>
              <span className="flex size-10 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-5 text-lg font-bold text-navy-950">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-navy-800">{step.text}</p>
            </li>
          ))}
        </ol>

        <p className="mt-12">
          <Link href="/hoe-het-werkt" className={textLinkClass}>
            Lees hoe het werkt, stap voor stap
          </Link>
        </p>
      </Container>
    </section>
  );
}

function PriceTeaser({ repairs }: { repairs: ReturnType<typeof summarizeRepairs> | null }) {
  return (
    <section aria-labelledby="prijzen-titel" className="bg-white py-16 md:py-24">
      <Container>
        <h2
          id="prijzen-titel"
          className="max-w-[20ch] text-3xl font-extrabold leading-tight tracking-[-0.02em] text-navy-950 md:text-4xl"
        >
          Vaste prijzen per reparatie
        </h2>
        <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-navy-800">
          De reparatieprijs zie je voordat je boekt. Voorrijkosten komen daar apart bij.
        </p>

        <div className="mt-12">
          {repairs === null ? (
            <Notice>We kunnen de prijzen nu niet laden. Probeer het later opnieuw.</Notice>
          ) : repairs.length === 0 ? (
            <Notice>Er staan nog geen prijzen online. Kijk later nog eens.</Notice>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {repairs.slice(0, 6).map((repair) => (
                <li key={repair.id} className="rounded-2xl bg-navy-50 p-6 ring-1 ring-navy-100">
                  <h3 className="text-lg font-bold text-navy-950">{repair.name}</h3>
                  {repair.description ? (
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-navy-700">{repair.description}</p>
                  ) : null}
                  <p className="mt-6 text-sm font-medium text-navy-700">Vanaf</p>
                  <p className="text-3xl font-extrabold tracking-[-0.02em] text-navy-950">
                    {formatEuro(repair.fromPriceCents)}
                  </p>
                  <p className="mt-2 text-sm text-navy-700">
                    Duur:{" "}
                    {repair.minDurationMinutes === repair.maxDurationMinutes
                      ? `${repair.minDurationMinutes} min`
                      : `${repair.minDurationMinutes} tot ${repair.maxDurationMinutes} min`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-10">
          <Link href="/prijzen" className={textLinkClass}>
            Bekijk alle prijzen per toestel
          </Link>
        </p>
      </Container>
    </section>
  );
}

function Trust({ settings }: { settings: PublicSettings | null }) {
  const points = [
    {
      title: "Prijs vooraf duidelijk",
      text: "Je ziet de reparatieprijs voordat je boekt. Alleen de voorrijkosten komen daar nog bij.",
    },
    {
      title: "Terug op het afgesproken moment",
      text: "Je toestel is uiterlijk op het eindtijdstip van je boeking weer bij je.",
    },
    {
      title: "Betalen in twee stappen",
      text: settings
        ? `Je betaalt ${depositPhrase(settings)} vooraf. Het restant betaal je bij terugbrengen, met pin of contant.`
        : "Een aanbetaling vooraf en het restant bij terugbrengen, met pin of contant.",
    },
    {
      title: "Annuleren tot het begin",
      text: "Tot het moment dat je afspraak begint, kun je annuleren. De terugbetaling staat bij de vragen.",
    },
  ];

  return (
    <section aria-labelledby="vertrouwen-titel" className="on-dark bg-navy-950 py-16 text-white md:py-24">
      <Container>
        <h2
          id="vertrouwen-titel"
          className="max-w-[22ch] text-3xl font-extrabold leading-tight tracking-[-0.02em] md:text-4xl"
        >
          Waar je op kunt rekenen
        </h2>

        <ul className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {points.map((point) => (
            <li key={point.title}>
              <h3 className="text-lg font-bold">{point.title}</h3>
              <p className="mt-2 leading-relaxed text-navy-200">{point.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function FaqTeaser({ items }: { items: ReturnType<typeof buildFaq> }) {
  return (
    <section aria-labelledby="faq-titel" className="py-16 md:py-24">
      <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <h2 id="faq-titel" className="text-3xl font-extrabold leading-tight tracking-[-0.02em] text-navy-950 md:text-4xl">
            Veelgestelde vragen
          </h2>
          <p className="mt-4 leading-relaxed text-navy-800">Staat je vraag er niet bij? Neem gerust contact op.</p>
          <p className="mt-8">
            <Link href="/faq" className={textLinkClass}>
              Alle vragen
            </Link>
          </p>
        </div>
        <FaqList items={items} groupName="faq-home" />
      </Container>
    </section>
  );
}

function ClosingCta({ settings }: { settings: PublicSettings | null }) {
  return (
    <section aria-labelledby="afsluiting-titel" className="pb-20 md:pb-28">
      <Container>
        <div className="flex flex-col gap-8 rounded-3xl bg-white p-8 ring-1 ring-navy-100 md:flex-row md:items-center md:justify-between md:p-12">
          <div>
            <h2 id="afsluiting-titel" className="text-2xl font-extrabold tracking-[-0.02em] text-navy-950 md:text-3xl">
              Klaar om je toestel te laten repareren?
            </h2>
            <p className="mt-3 max-w-[46ch] leading-relaxed text-navy-800">
              Boek je tijdstip en betaal de aanbetaling om het vast te leggen.
              {settings?.phone ? (
                <>
                  {" "}
                  Liever bellen? Dat kan op{" "}
                  <a href={phoneHref(settings.phone)} className={textLinkClass}>
                    {settings.phone}
                  </a>
                  .
                </>
              ) : null}
            </p>
          </div>
          <Link href="/boeken" className={`${buttonClass("primary")} shrink-0`}>
            Boek een reparatie
          </Link>
        </div>
      </Container>
    </section>
  );
}
