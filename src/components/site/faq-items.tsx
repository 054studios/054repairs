import Link from "next/link";
import type { ReactNode } from "react";
import { textLinkClass } from "./button";
import { depositPhrase, durationLabel, refundText, travelSummary } from "./facts";
import { durationRange, type Catalogue, type PublicSettings } from "./data";

export type FaqItem = { id: string; question: string; answer: ReactNode };

// Answers that depend on prices or rules use the live values. Without them, a generic answer is shown.
export function buildFaq(settings: PublicSettings | null, catalogue: Catalogue | null): FaqItem[] {
  const travel = settings ? travelSummary(settings) : null;
  const range = catalogue ? durationRange(catalogue) : null;

  return [
    {
      id: "ophalen",
      question: "Hoe werkt het ophalen?",
      answer:
        "Je boekt een tijdstip en vult je adres in. Op het afgesproken moment halen we je toestel op bij dat adres. Uiterlijk op het eindtijdstip van je boeking brengen we het terug.",
    },
    {
      id: "voorrijkosten",
      question: "Wat kosten de voorrijkosten?",
      answer: travel
        ? [travel.free, travel.over, travel.example, travel.max, "Het bedrag voor jouw adres zie je voordat je boekt."]
            .filter(Boolean)
            .join(" ")
        : "De voorrijkosten hangen af van de afstand tot je adres. Je ziet het bedrag voordat je boekt.",
    },
    {
      id: "betaling",
      question: "Welke betaalmethoden zijn er?",
      answer: settings ? (
        <>
          Je betaalt {depositPhrase(settings)} vooraf online. Dat legt je tijdstip vast. Het restant betaal je bij
          terugbrengen met pin of contant.
          {settings.allowFullPrepay ? " Je kunt ook meteen het volledige bedrag online betalen." : null}
        </>
      ) : (
        "Je betaalt een aanbetaling online om je tijdstip vast te leggen. Het restant betaal je bij terugbrengen met pin of contant."
      ),
    },
    {
      id: "annuleren",
      question: "Kan ik annuleren?",
      answer: (
        <>
          Ja, tot het moment dat je afspraak begint.{" "}
          {settings ? `${refundText(settings)} ` : "De terugbetaling hangt af van het moment van annuleren. "}
          Lees de <Link href="/voorwaarden" className={textLinkClass}>voorwaarden</Link> voor alle details.
        </>
      ),
    },
    {
      id: "duur",
      question: "Hoe lang duurt een reparatie?",
      answer: range
        ? `${
            range.min === range.max
              ? `De reparatie duurt ${durationLabel(range.min, range.max)}.`
              : `De duur van een reparatie ligt tussen ${range.min} en ${range.max} minuten.`
          } Je toestel is uiterlijk op het eindtijdstip van je boeking weer bij je.`
        : "De duur van je reparatie staat in je boeking. Je toestel is uiterlijk op het eindtijdstip weer bij je.",
    },
    {
      id: "garantie",
      question: "Welke garantie krijg ik?",
      answer: (
        <>
          Op de uitgevoerde reparatie geven wij garantie. De garantietermijn en de voorwaarden staan in de{" "}
          <Link href="/voorwaarden" className={textLinkClass}>
            algemene voorwaarden
          </Link>
          .
        </>
      ),
    },
    {
      id: "backup",
      question: "Moet ik een back-up maken?",
      answer:
        "Ja, maak vooraf een back-up van je toestel. Bij een reparatie kunnen gegevens verloren gaan, ook als we zorgvuldig werken.",
    },
  ];
}
