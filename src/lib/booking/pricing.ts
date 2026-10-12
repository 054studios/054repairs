// Price rules that must match the database exactly (see public.create_booking).
// Km are handled in tenths and cents in integer math, so rounding never drifts from the database.
import type { PaymentChoice, PublicSettings, TravelQuote } from "./types";

export function buildTravelQuote(
  km: number,
  source: TravelQuote["source"],
  settings: PublicSettings,
): TravelQuote {
  const kmTenths = Math.round(km * 10);
  const freeTenths = Math.round(settings.freeTravelKm * 10);
  const maxTenths = Math.round(settings.maxTravelKm * 10);
  const roundTrip = settings.travelDistanceMode === "round_trip";
  const factor = roundTrip ? 2 : 1;

  // billable = max(0, km - free) * factor, fee = round(billable * price per km)
  const billableTenths = Math.max(0, kmTenths - freeTenths) * factor;
  // Half away from zero, the same rounding as Postgres round() on numeric.
  const feeCents = Math.floor((billableTenths * settings.pricePerKmCents + 5) / 10);

  return {
    km: kmTenths / 10,
    source,
    billableKm: billableTenths / 10,
    feeCents,
    freeTravelKm: settings.freeTravelKm,
    maxTravelKm: settings.maxTravelKm,
    pricePerKmCents: settings.pricePerKmCents,
    roundTrip,
    withinArea: kmTenths <= maxTenths,
  };
}

// Preview of the upfront amount. The database value from create_booking is the one that counts.
export function depositCentsFor(totalCents: number, settings: PublicSettings, choice: PaymentChoice): number {
  if (choice === "full") {
    return totalCents;
  }

  if (settings.depositType === "fixed") {
    return Math.min(Math.round(settings.depositValue), totalCents);
  }

  // round(total * value / 100), half away from zero
  const valueHundredths = Math.round(settings.depositValue * 100);
  return Math.floor((totalCents * valueHundredths + 5000) / 10000);
}
