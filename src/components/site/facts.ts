import { formatEuro } from "@/lib/money";
import type { PublicSettings } from "./data";

// Plain sentences built from the live settings. Every number on the site comes from here.
// No server-only imports, so client islands can use the helpers too.

export const kmLabel = (value: number) => value.toLocaleString("nl-NL", { maximumFractionDigits: 1 });

export type TravelRule = Pick<PublicSettings, "freeTravelKm" | "pricePerKmCents" | "travelDistanceMode">;

// Same formula as create_booking in the database:
// billable = max(0, km - free) * (2 for round trip), fee = round(billable * price per km).
export function travelFeeCents(km: number, rule: TravelRule): number {
  const multiplier = rule.travelDistanceMode === "round_trip" ? 2 : 1;
  const billable = Math.max(0, km - rule.freeTravelKm) * multiplier;
  return Math.round(billable * rule.pricePerKmCents);
}

export function travelSummary(settings: PublicSettings) {
  const roundTrip = settings.travelDistanceMode === "round_trip";
  const perKm = formatEuro(settings.pricePerKmCents);

  const freeKm = settings.freeTravelKm > 0 ? kmLabel(settings.freeTravelKm) : null;
  const free =
    freeKm === null
      ? "Wij rekenen voorrijkosten vanaf de eerste kilometer."
      : `Tot ${freeKm} km afstand rijden we gratis.`;

  const over = roundTrip
    ? `Daarboven betaal je ${perKm} per kilometer, heen en terug gerekend.`
    : `Daarboven betaal je ${perKm} per kilometer.`;

  // Worked example with ten kilometres beyond the free range, calculated the same way as the booking.
  const extraKm = Math.min(10, settings.maxTravelKm - settings.freeTravelKm);
  const example =
    extraKm > 0
      ? `Op ${kmLabel(settings.freeTravelKm + extraKm)} km afstand betaal je ${formatEuro(
          travelFeeCents(settings.freeTravelKm + extraKm, settings),
        )} voorrijkosten.`
      : null;

  return {
    freeKm,
    free,
    over,
    example,
    max: `Wij komen tot ${kmLabel(settings.maxTravelKm)} km afstand.`,
    perKm,
    maxKm: kmLabel(settings.maxTravelKm),
    roundTrip,
  };
}

export function depositPhrase(settings: PublicSettings): string {
  return settings.depositType === "percent"
    ? `${settings.depositValue}% van het totaalbedrag`
    : `een vast bedrag van ${formatEuro(settings.depositValue)}`;
}

export function refundText(settings: PublicSettings): string {
  const percent = settings.lateCancelRefundPercent;

  if (settings.fullRefundHours > 0) {
    return `Annuleer je meer dan ${settings.fullRefundHours} uur voor je afspraak, dan krijg je alles terug. Daarna krijg je ${percent}% van wat je hebt betaald terug.`;
  }

  return `Je krijgt ${percent}% van wat je hebt betaald terug.`;
}

export function durationLabel(min: number, max: number): string {
  return min === max ? `${min} min` : `${min} tot ${max} min`;
}

// "45 minuten", "1 uur", "1 uur en 15 minuten"
export function minutesLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) {
    return `${rest} minuten`;
  }

  return rest === 0 ? `${hours} uur` : `${hours} uur en ${rest} minuten`;
}

export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
