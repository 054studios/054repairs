"use client";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { searchAddress, calculateTravel } from "@/app/(site)/boeken/actions";
import type { AddressSuggestion, TravelQuote } from "@/lib/booking/types";
import { buttonClass, inputClass, labelClass } from "@/components/ui/styles";
import { LoadingState, Skeleton, Spinner } from "@/components/ui/skeleton";
import { formatEuro } from "@/lib/money";

export function AreaCheck() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AddressSuggestion[]>([]);
  const [chosen, setChosen] = useState<AddressSuggestion | null>(null);
  const [quote, setQuote] = useState<TravelQuote | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const latest = useRef(0);
  function search(event: React.FormEvent) {
    event.preventDefault();
    const id = ++latest.current;
    setError("");
    setQuote(null);
    setChosen(null);
    setResults([]);
    startTransition(async () => {
      try {
        const result = await searchAddress(query);
        if (id !== latest.current) return;
        if (!result.ok) setError(result.message);
        else if (!result.suggestions.length)
          setError("Geen adres gevonden. Vul je postcode en huisnummer in.");
        else setResults(result.suggestions);
      } catch {
        if (id === latest.current)
          setError("Adressen zoeken lukt nu niet. Probeer het opnieuw.");
      }
    });
  }
  function pick(address: AddressSuggestion) {
    const id = ++latest.current;
    setChosen(address);
    setQuote(null);
    setError("");
    setResults([]);
    startTransition(async () => {
      try {
        const result = await calculateTravel(address.lat, address.lng);
        if (id !== latest.current) return;
        if (result.ok) setQuote(result.quote);
        else setError(result.message);
      } catch {
        if (id === latest.current)
          setError("Berekenen lukt nu niet. Probeer het opnieuw.");
      }
    });
  }
  return (
    <div className="max-w-xl rounded-panel bg-ink-900 p-5 ring-1 ring-line sm:p-7">
      <form onSubmit={search}>
        <label htmlFor="area-address" className={labelClass}>
          Postcode en huisnummer
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="area-address"
            value={query}
            onChange={(e) => {
              ++latest.current;
              setQuery(e.target.value);
              setQuote(null);
              setChosen(null);
              setResults([]);
              setError("");
            }}
            required
            minLength={4}
            maxLength={100}
            placeholder="Bijvoorbeeld 1012 AB 10"
            autoComplete="off"
            className={inputClass}
          />
          <button disabled={pending} className={buttonClass("primary", "md")}>
            {pending && <Spinner />}
            {pending ? "Even geduld…" : "Check adres"}
          </button>
        </div>
      </form>
      {results.length > 0 && (
        <ul
          aria-label="Kies je adres"
          className="content-arrive mt-4 divide-y divide-line"
        >
          {results.map((a) => (
            <li key={a.label}>
              <button
                type="button"
                onClick={() => pick(a)}
                className="min-h-12 w-full py-3 text-left text-cyan-300 underline"
              >
                {a.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {pending && (
        <LoadingState
          label={chosen ? "Voorrijkosten berekenen" : "Adressen zoeken"}
          className="mt-4 min-h-28 rounded-ui bg-ink-850 p-4"
        >
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="mt-3 h-5 w-1/2" />
          <Skeleton className="mt-3 h-4 w-2/3" />
        </LoadingState>
      )}
      <div aria-live="polite" className="mt-4">
        {chosen && <p className="text-steel-300">{chosen.label}</p>}
        {quote && (
          <div className="content-arrive">
            <p className="mt-3 font-semibold">
              {quote.withinArea
                ? `Wij komen naar je toe. Voorrijkosten: ${formatEuro(quote.feeCents)}.`
                : "Dit adres ligt buiten ons huidige werkgebied."}
            </p>
            <p className="mt-2 text-sm text-steel-400">
              {quote.source === "estimate"
                ? "Dit is een indicatie op basis van een geschatte rijafstand."
                : "Berekend op basis van de rijafstand."}{" "}
              De kosten worden bij het boeken opnieuw gecontroleerd.
            </p>
            {quote.withinArea && (
              <Link
                href="/boeken"
                className={`${buttonClass("primary", "md")} mt-5`}
              >
                Kies je reparatie
              </Link>
            )}
          </div>
        )}
        {error && (
          <p role="alert" className="text-bad">
            {error}
          </p>
        )}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-steel-400">
        Je adres wordt voor deze check opgezocht bij PDOK en gebruikt om de
        afstand te berekenen. Deze check maakt geen boeking aan.
      </p>
    </div>
  );
}
