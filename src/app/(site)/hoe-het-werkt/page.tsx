import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClass, textLinkClass } from "@/components/site/button";
import { getPublicSettings } from "@/components/site/data";
import { depositPhrase } from "@/components/site/facts";
import { Container, Notice, PageHeader } from "@/components/site/ui";

// The booking details and deposit text come from the database on each request.
export const instant = false;

export const metadata: Metadata = {
  title: "Hoe het werkt",
  description: "Van boeking tot terugbezorging, in vier stappen. Wat je zelf doet en wat wij doen.",
};

export default async function HowItWorksPage() {
  const settings = await getPublicSettings();

  return (
    <>
      <PageHeader
        title="Hoe het werkt"
        lead="Van je boeking tot het moment dat je toestel weer bij je is. Hieronder lees je wat er bij elke stap gebeurt."
      />

      <Container className="space-y-16 pb-24">
        <ol className="space-y-14">
          <Step number={1} title="Boek online">
            <p>
              Kies je merk en model, en de reparatie die je nodig hebt. Per reparatie kies je één kwaliteit. Je ziet
              direct de prijs en de duur.
            </p>
            <p>
              Daarna kies je een moment dat vrij is en vul je je adres in, zodat we de voorrijkosten kunnen berekenen.
              {settings ? ` Je boekt minimaal ${settings.bookingLeadHours} uur vooruit.` : null}
            </p>
            <p>
              Met de aanbetaling leg je het tijdstip vast.
              {settings ? ` Je betaalt ${depositPhrase(settings)} vooraf.` : null} Betaal je niet op tijd, dan vervalt de
              boeking en komt het moment weer vrij.
            </p>
          </Step>

          <Step number={2} title="Wij halen je toestel op">
            <p>
              Op het afgesproken moment komen we je toestel ophalen op het adres dat je hebt opgegeven. Maak daarvoor
              vooraf een back-up.
            </p>
            <p>Deel je pincode of wachtwoord nooit per e-mail of via een bericht.</p>
          </Step>

          <Step number={3} title="Wij repareren je toestel">
            <p>
              We repareren je toestel binnen de duur die bij je reparatie staat. Die duur bepaalt het eindtijdstip van je
              boeking.
            </p>
          </Step>

          <Step number={4} title="Wij brengen het terug">
            <p>
              Uiterlijk op het eindtijdstip van je boeking brengen we je toestel terug naar je adres. Het restant betaal
              je dan met pin of contant, tenzij je al volledig hebt betaald.
            </p>
          </Step>
        </ol>

        <Notice tone="note">
          Onze belangrijkste belofte: je toestel is uiterlijk op het eindtijdstip van je boeking weer bij je.
        </Notice>

        <section aria-labelledby="nodig-titel" className="max-w-[60ch]">
          <h2 id="nodig-titel" className="text-2xl font-extrabold tracking-[-0.02em] text-navy-950 md:text-3xl">
            Wat je nodig hebt
          </h2>
          <ul className="mt-6 list-disc space-y-3 pl-5 leading-relaxed text-navy-800 marker:text-navy-400">
            <li>Je toestel, met de gegevens die nodig zijn voor de reparatie.</li>
            <li>Een adres waar we het toestel kunnen ophalen en weer kunnen terugbrengen.</li>
            <li>Een back-up van je gegevens. Bij een reparatie kunnen gegevens verloren gaan.</li>
          </ul>
        </section>

        <BookingCta />
      </Container>
    </>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <li className="grid gap-5 md:grid-cols-[3.5rem_1fr] md:gap-8">
      <span className="flex size-10 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white md:size-12 md:text-base">
        {number}
      </span>
      <div className="max-w-[60ch] space-y-4 leading-relaxed text-navy-800">
        <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-navy-950">{title}</h2>
        {children}
      </div>
    </li>
  );
}

function BookingCta() {
  return (
    <section aria-labelledby="boek-titel" className="rounded-3xl bg-white p-8 ring-1 ring-navy-100 md:p-12">
      <h2 id="boek-titel" className="text-2xl font-extrabold tracking-[-0.02em] text-navy-950 md:text-3xl">
        Klaar om te boeken?
      </h2>
      <p className="mt-3 max-w-[48ch] leading-relaxed text-navy-800">
        Kies je reparatie en een moment. Heb je nog een vraag? Bekijk de veelgestelde vragen of neem contact op.
      </p>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <Link href="/boeken" className={buttonClass("primary")}>
          Boek een reparatie
        </Link>
        <Link href="/faq" className={textLinkClass}>
          Veelgestelde vragen
        </Link>
      </div>
    </section>
  );
}
