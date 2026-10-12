import { MapPinIcon } from "@phosphor-icons/react";
import { useRef, useState, useTransition, type KeyboardEvent, type ReactNode } from "react";
import { formatKm, formatPostcode } from "@/lib/booking/format";
import {
  buttonClass,
  chipClass,
  hintClass,
  inputClass,
  insetClass,
  labelClass,
  skeletonClass,
  stepPanelClass,
} from "@/lib/booking/styles";
import type { AddressSuggestion, TravelQuote } from "@/lib/booking/types";
import { formatEuro } from "@/lib/money";
import { searchAddress } from "../actions";
import { Notice } from "./notice";
import { StepHeading } from "./step-heading";

const LIST_ID = "address-options";

function suggestionKey(suggestion: AddressSuggestion) {
  return `${suggestion.postcode}-${suggestion.houseNumber}-${suggestion.lat}-${suggestion.lng}`;
}

export function StepAddress({
  address,
  travel,
  busy,
  travelFailed,
  onPick,
  onRetry,
  onReset,
}: {
  address: AddressSuggestion | null;
  travel: TravelQuote | null;
  busy: boolean;
  travelFailed: boolean;
  onPick: (suggestion: AddressSuggestion) => void;
  onRetry: () => void;
  onReset: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AddressSuggestion[]>([]);
  const [searched, setSearched] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, startSearch] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Only the newest search may update the list, so slow answers cannot overwrite newer ones.
  const latest = useRef(0);
  // Focus follows the visitor: to the chosen address after a pick, back to the field after a reset.
  const focusInput = useRef(false);
  const focusChosen = useRef(false);

  const trimmed = query.trim();
  const showList = open && results.length > 0;
  const noMatch = !searching && !searchError && searched !== null && searched === trimmed && results.length === 0;

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
        setSearched(value);
        setOpen(true);
        setActive(-1);
        setSearchError(null);
      } else {
        setSearchError(result.message);
      }
    });
  }

  function handleQuery(value: string) {
    setQuery(value);
    clearTimeout(timer.current);

    const next = value.trim();

    if (next.length < 4) {
      latest.current += 1;
      setResults([]);
      setSearched(null);
      setActive(-1);
      setSearchError(null);
      return;
    }

    timer.current = setTimeout(() => runSearch(next), 350);
  }

  function handlePick(suggestion: AddressSuggestion) {
    latest.current += 1;
    clearTimeout(timer.current);
    setResults([]);
    setSearched(null);
    setOpen(false);
    setActive(-1);
    setQuery("");
    focusChosen.current = true;
    onPick(suggestion);
  }

  function handleReset() {
    focusInput.current = true;
    onReset();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) {
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setOpen(true);
        setActive((index) => (index + 1) % results.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setOpen(true);
        setActive((index) => (index <= 0 ? results.length - 1 : index - 1));
        break;
      case "Enter": {
        const pick = active >= 0 ? results[active] : results.length === 1 ? results[0] : undefined;

        if (showList && pick) {
          event.preventDefault();
          handlePick(pick);
        }
        break;
      }
      case "Escape":
        if (showList) {
          event.preventDefault();
          setOpen(false);
          setActive(-1);
        }
        break;
    }
  }

  return (
    <>
      <StepHeading
        title="Waar komen wij naartoe?"
        text="Zoek je adres op postcode en huisnummer. Daarna zie je direct de voorrijkosten."
      />

      <div className={stepPanelClass}>
        {address ? (
          <section
            ref={(element) => {
              if (element && focusChosen.current) {
                focusChosen.current = false;
                element.focus();
              }
            }}
            tabIndex={-1}
            aria-labelledby="chosen-address"
            className={`${insetClass} flex items-start gap-3 p-4`}
          >
            <MapPinIcon size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-cyan-400" />
            <div className="min-w-0 flex-1">
              <h2 id="chosen-address" className="sr-only">
                Gekozen adres
              </h2>
              <p className="break-words font-semibold text-steel-50">
                {address.street} {address.houseNumber}
              </p>
              <p className="figures break-words text-[0.9375rem] text-steel-300">
                {formatPostcode(address.postcode)} {address.city}
              </p>
            </div>
            <button type="button" onClick={handleReset} className={`${buttonClass("ghost", "md")} -my-1.5 -mr-3 shrink-0`}>
              Ander adres
            </button>
          </section>
        ) : (
          <div>
            <label htmlFor="address-search" className={labelClass}>
              Postcode en huisnummer
            </label>
            <div className="relative mt-2">
              <MapPinIcon
                size={20}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-steel-400"
              />
              <input
                ref={(element) => {
                  if (element && focusInput.current) {
                    focusInput.current = false;
                    element.focus();
                  }
                }}
                id="address-search"
                type="text"
                role="combobox"
                aria-expanded={showList}
                aria-controls={LIST_ID}
                aria-autocomplete="list"
                aria-activedescendant={showList && active >= 0 ? `${LIST_ID}-${active}` : undefined}
                aria-describedby="address-hint"
                value={query}
                onChange={(event) => handleQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="1234 AB 5"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                enterKeyHint="search"
                className={`${inputClass} pl-11`}
              />
            </div>
            <p id="address-hint" className={`${hintClass} mt-2`}>
              Typ je postcode en huisnummer en kies je adres uit de lijst.
            </p>

            <ul
              id={LIST_ID}
              role="listbox"
              aria-label="Gevonden adressen"
              hidden={!showList}
              className="mt-3 space-y-1 rounded-ui bg-ink-850 p-1.5 ring-1 ring-line-strong"
            >
              {results.map((suggestion, index) => (
                <li
                  key={suggestionKey(suggestion)}
                  id={`${LIST_ID}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => handlePick(suggestion)}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-[7px] px-3 py-2.5 text-[0.9375rem] transition-colors duration-100 ${
                    index === active ? "bg-ink-700 text-steel-50" : "text-steel-100"
                  }`}
                >
                  <MapPinIcon
                    size={18}
                    aria-hidden="true"
                    className={`shrink-0 ${index === active ? "text-cyan-400" : "text-steel-400"}`}
                  />
                  <span className="min-w-0 break-words">{suggestion.label}</span>
                </li>
              ))}
            </ul>

            <div aria-live="polite" className="text-[0.9375rem]">
              {searching && results.length === 0 && (
                <div className="mt-3 space-y-1.5" aria-busy="true">
                  <span className="sr-only">Adressen zoeken</span>
                  <div className={`${skeletonClass} h-12`} />
                  <div className={`${skeletonClass} h-12`} />
                </div>
              )}
              {noMatch && (
                <p className="mt-3 text-steel-300">
                  Geen adres gevonden voor &ldquo;{trimmed}&rdquo;. Controleer de postcode en het huisnummer, bijvoorbeeld
                  1234 AB 5.
                </p>
              )}
              {showList && (
                <span className="sr-only">
                  {results.length === 1 ? "1 adres gevonden" : `${results.length} adressen gevonden`}
                </span>
              )}
            </div>

            {searchError && (
              <Notice tone="bad" role="alert" className="mt-3">
                {searchError}
              </Notice>
            )}
          </div>
        )}

        {address && busy && !travel && (
          <div className={`${insetClass} mt-4 p-4`} aria-busy="true" aria-live="polite">
            <span className="sr-only">Voorrijkosten berekenen</span>
            <div className="flex items-center justify-between gap-4">
              <div className={`${skeletonClass} h-5 w-32`} />
              <div className={`${skeletonClass} h-7 w-20`} />
            </div>
            <div className={`${skeletonClass} mt-4 h-4 w-3/4`} />
            <div className={`${skeletonClass} mt-2.5 h-4 w-2/3`} />
          </div>
        )}

        {address && travelFailed && !busy && !travel && (
          <div className={`${insetClass} mt-4 p-4`}>
            <p className="text-[0.9375rem] text-steel-300">
              De voorrijkosten voor dit adres zijn nog niet berekend. Zonder voorrijkosten kun je niet verder.
            </p>
            <button type="button" onClick={onRetry} className={`${buttonClass("secondary", "md")} mt-3`}>
              Bereken opnieuw
            </button>
          </div>
        )}

        {address && travel && <TravelSummary travel={travel} />}
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-steel-400">{label}</dt>
      <dd className="flex items-center gap-2 text-right text-steel-100">{children}</dd>
    </div>
  );
}

function TravelSummary({ travel }: { travel: TravelQuote }) {
  const free = travel.feeCents === 0;
  const estimate = travel.source === "estimate";

  return (
    <section className={`${insetClass} mt-4 p-4`} aria-labelledby="travel-title">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="travel-title" className="font-display text-lg font-semibold tracking-[-0.02em] text-steel-50">
          Voorrijkosten
        </h2>
        <p
          key={travel.feeCents}
          className="figure-swap figures font-display text-2xl font-semibold tracking-[-0.02em] text-steel-50"
        >
          {free ? "Gratis" : formatEuro(travel.feeCents)}
        </p>
      </div>

      {free && travel.withinArea && (
        <p className="mt-1 text-sm text-steel-400">
          Gratis binnen <span className="figures">{formatKm(travel.freeTravelKm)}</span> van ons.
        </p>
      )}

      <dl className="mt-4 space-y-2 border-t border-line pt-3.5 text-[0.9375rem]">
        <Row label="Afstand">
          {estimate && <span className={chipClass("info")}>Schatting</span>}
          <span className="figures">{formatKm(travel.km)}</span>
        </Row>
        <Row label="Gratis tot">
          <span className="figures">{formatKm(travel.freeTravelKm)}</span>
        </Row>
        <Row label={travel.roundTrip ? "Betaalde km, heen en terug" : "Betaalde km"}>
          <span className="figures">{formatKm(travel.billableKm)}</span>
        </Row>
        <Row label="Tarief">
          <span className="figures">{formatEuro(travel.pricePerKmCents)} per km</span>
        </Row>
      </dl>

      {estimate && (
        <p className="mt-3 text-[0.8125rem] leading-snug text-steel-400">
          Schatting: wij meten de afstand hemelsbreed en tellen er 30 procent bij op voor de route.
        </p>
      )}

      {!travel.withinArea && (
        <Notice tone="bad" role="alert" className="mt-4">
          Dit adres ligt buiten ons werkgebied. Wij komen tot <span className="figures">{formatKm(travel.maxTravelKm)}</span>{" "}
          van ons. Kies een ander adres.
        </Notice>
      )}
    </section>
  );
}
