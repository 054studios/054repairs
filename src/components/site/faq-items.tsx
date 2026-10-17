import Link from "next/link";
import type { ReactNode } from "react";
import { textLinkClass } from "@/components/ui/styles";
import {
  depositPhrase,
  minutesLabel,
  refundText,
  travelSummary,
} from "./facts";
import { durationRange, type Catalogue, type PublicSettings } from "./data";

export type FaqGroup = "boeken" | "reparatie";
export type FaqItem = {
  id: string;
  group: FaqGroup;
  question: string;
  answer: ReactNode;
};

export const faqGroups: { id: FaqGroup; title: string }[] = [
  { id: "reparatie", title: "De reparatie" },
  { id: "boeken", title: "Boeken en betalen" },
];

// Answers that depend on prices or rules use the live values. Without them, a general answer is shown.
// No warranty answer: the owner has not set a warranty term yet.
export function buildFaq(
  settings: PublicSettings | null,
  catalogue: Catalogue | null,
): FaqItem[] {
  const travel = settings ? travelSummary(settings) : null;
  const range = catalogue ? durationRange(catalogue) : null;

  return [
    {
      id: "werkwijze",
      group: "reparatie",
      question: "Waar vindt de reparatie plaats?",
      answer:
        "Bij jou in de buurt. Wij rijden naar het adres dat je opgeeft en repareren je iPhone op locatie. Zodra de reparatie klaar is, krijg je je toestel terug.",
    },
    {
      id: "duur",
      group: "reparatie",
      question: "Hoe lang duurt een reparatie?",
      answer: range
        ? `${
            range.min === range.max
              ? `Een reparatie duurt ${minutesLabel(range.min)}.`
              : `Dat hangt af van de reparatie: van ${range.min} tot ${range.max} minuten.`
          } Bij de prijs zie je precies hoe lang jouw reparatie duurt. Zo lang duurt ook je afspraak.`
        : "Dat hangt af van de reparatie. Bij de prijs zie je hoe lang jouw reparatie duurt. Zo lang duurt ook je afspraak.",
    },
    {
      id: "aanwezig",
      group: "reparatie",
      question: "Moet ik erbij zijn?",
      answer:
        "Je bent op het afgesproken tijdstip op je adres. Daar geef je je iPhone aan ons, en daar krijg je hem terug zodra de reparatie klaar is.",
    },
    {
      id: "onderdeel",
      group: "reparatie",
      question: "Wat als een onderdeel niet beschikbaar is?",
      answer:
        "Dan nemen we contact met je op voordat we naar je toe rijden, en overleggen we hoe we verder gaan, bijvoorbeeld met een nieuw tijdstip.",
    },
    {
      id: "backup",
      group: "reparatie",
      question: "Moet ik een back-up maken?",
      answer:
        "Ja, maak vooraf een back-up van je iPhone. Bij een reparatie kunnen gegevens verloren gaan, ook als we zorgvuldig werken.",
    },
    {
      id: "voorrijkosten",
      group: "boeken",
      question: "Wat kosten de voorrijkosten?",
      answer: travel
        ? [
            travel.free,
            travel.over,
            travel.example,
            travel.max,
            "Het bedrag voor jouw adres zie je voordat je betaalt.",
          ]
            .filter(Boolean)
            .join(" ")
        : "De voorrijkosten hangen af van de afstand tot je adres. Je ziet het bedrag voordat je betaalt.",
    },
    {
      id: "betaling",
      group: "boeken",
      question: "Hoe betaal ik?",
      answer: settings ? (
        <>
          Bij het boeken betaal je {depositPhrase(settings)} online. Daarmee
          ligt je tijdstip vast. Het restbedrag betaal je met pin of contant als
          je je iPhone terugkrijgt.
          {settings.allowFullPrepay
            ? " Je kunt ook meteen het hele bedrag online betalen."
            : null}
        </>
      ) : (
        "Bij het boeken betaal je een aanbetaling online. Daarmee ligt je tijdstip vast. Het restbedrag betaal je met pin of contant als je je iPhone terugkrijgt."
      ),
    },
    {
      id: "annuleren",
      group: "boeken",
      question: "Kan ik annuleren?",
      answer: (
        <>
          Ja, tot het moment dat je afspraak begint.{" "}
          {settings
            ? `${refundText(settings)} `
            : "Hoeveel je terugkrijgt, hangt af van het moment van annuleren. "}
          Lees de{" "}
          <Link href="/voorwaarden" className={textLinkClass}>
            voorwaarden
          </Link>{" "}
          voor alle details.
        </>
      ),
    },
  ];
}
