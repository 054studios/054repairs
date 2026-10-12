import { useRef, useState, useTransition } from "react";
import { formatKm, formatPostcode } from "@/lib/booking/format";
import { cardClass, inputClass } from "@/lib/booking/styles";
import type { AddressSuggestion, TravelQuote } from "@/lib/booking/types";
import { formatEuro } from "@/lib/money";
import { searchAddress } from "../actions";
import { StepHeading } from "./step-heading";

export function StepAddress({
  address,
  travel,
  busy,
  onPick,
  onReset,
}: {
  address: AddressSuggestion | null;
  travel: TravelQuote | null;
  busy: boolean;
  onPick: (suggestion: AddressSuggestion) => void;
  onReset: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AddressSuggestion[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, startSearch] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Only the newest search may update the list, so slow answers cannot overwrite newer ones.
  const latest = useRef(0);

  function runSearch(value: string) {
    latest.current += 1;
    const id = latest.current;

    startSearch(async () => {
      const result = await searchAddress(value);

      if (latest.current !== id) {
        return;
      }

      if (result.ok) {
        setResults(result.suggestions);
        setSearchError(null);
      } else {
        setSearchError(result.message);
      }
    });
  }

  function handleQuery(value: string) {
    setQuery(value);
    clearTimeout(timer.current);

    const trimmed = value.trim();

    if (trimmed.length < 4) {
      latest.current += 1;
      setResults([]);
      setSearchError(null);
      return;
    }

    timer.current = setTimeout(() => runSearch(trimmed), 350);
  }

  function handlePick(suggestion: AddressSuggestion) {
    latest.current += 1;
    setResults([]);
    setQuery("");
    onPick(suggestion);
  }

  return (
    <>
      <StepHeading
        title="Waar halen we je toestel op?"
        text="Zoek je adres op. Daarna berekenen we de voorrijkosten."
      />

      {address ? (
        <section className={cardClass} aria-labelledby="chosen-address">
          <h2 id="chosen-address" className="text-sm font-medium text-navy-600">
            Gekozen adres
          </h2>
          <p className="mt-1 break-words text-lg font-semibold text-navy-950">
            {address.street} {address.houseNumber}
          </p>
          <p className="break-words text-base text-navy-800">
            {formatPostcode(address.postcode)} {address.city}
          </p>
          <button
            type="button"
            onClick={onReset}
            className="mt-4 rounded-md text-sm font-medium text-navy-700 underline underline-offset-4 hover:text-navy-950 focus-visible:outline-2 focus-visible:outline-navy-600"
          >
            Ander adres kiezen
          </button>
        </section>
      ) : (
        <div>
          <label htmlFor="address-search" className="block text-sm font-medium text-navy-900">
            Postcode en huisnummer
          </label>
          <input
            id="address-search"
            type="search"
            value={query}
            onChange={(event) => handleQuery(event.target.value)}
            placeholder="Bijvoorbeeld 7511 AB 12"
            autoComplete="off"
            aria-describedby="address-hint"
            className={`${inputClass} mt-2`}
          />
          <p id="address-hint" className="mt-2 text-sm text-navy-600">
            Typ je postcode en huisnummer. Kies daarna je adres uit de lijst.
          </p>

          {searching && <p className="mt-3 text-sm text-navy-600">Adressen zoeken…</p>}
          {searchError && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {searchError}
            </p>
          )}

          {results.length > 0 && (
            <ul className="mt-3 space-y-2">
              {results.map((suggestion) => (
                <li key={`${suggestion.postcode}-${suggestion.houseNumber}-${suggestion.lat}-${suggestion.lng}`}>
                  <button
                    type="button"
                    onClick={() => handlePick(suggestion)}
                    className="w-full rounded-xl bg-white px-4 py-3 text-left text-base text-navy-950 ring-1 ring-navy-200 transition hover:ring-2 hover:ring-navy-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600"
                  >
                    {suggestion.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {address && busy && !travel && (
        <p className="mt-6 text-sm text-navy-600" aria-live="polite">
          Voorrijkosten berekenen…
        </p>
      )}

      {travel && <TravelSummary travel={travel} />}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-navy-700">{label}</dt>
      <dd className="text-right font-medium text-navy-950">{value}</dd>
    </div>
  );
}

function TravelSummary({ travel }: { travel: TravelQuote }) {
  const free = travel.feeCents === 0;

  return (
    <section className={`${cardClass} mt-6`} aria-labelledby="travel-title">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="travel-title" className="text-base font-semibold text-navy-950">
          Voorrijkosten
        </h2>
        <p className="text-xl font-semibold text-navy-950">{free ? "Gratis" : formatEuro(travel.feeCents)}</p>
      </div>

      {free && (
        <p className="mt-1 text-sm text-navy-600">Gratis binnen {formatKm(travel.freeTravelKm)} van ons.</p>
      )}

      <dl className="mt-4 space-y-2 text-sm">
        <Row label="Afstand" value={`${formatKm(travel.km)}${travel.source === "estimate" ? " (schatting)" : ""}`} />
        <Row label="Gratis tot" value={formatKm(travel.freeTravelKm)} />
        <Row
          label="Betaalde kilometers"
          value={`${formatKm(travel.billableKm)}${travel.roundTrip ? " (heen en terug)" : ""}`}
        />
        <Row label="Tarief" value={`${formatEuro(travel.pricePerKmCents)} per km`} />
      </dl>

      {!travel.withinArea && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          Dit adres ligt buiten ons werkgebied. We komen tot {formatKm(travel.maxTravelKm)} van ons.
        </p>
      )}
    </section>
  );
}
