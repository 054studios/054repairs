import { formatEuro } from "@/lib/money";
import type { PublicSettings } from "./data";

// Plain sentences built from the live settings. Every number on the site comes from here.

const km = (value: number) => value.toLocaleString("nl-NL", { maximumFractionDigits: 1 });

export function travelSummary(settings: PublicSettings) {
  const roundTrip = settings.travelDistanceMode === "round_trip";
  const multiplier = roundTrip ? 2 : 1;
  const perKm = formatEuro(settings.pricePerKmCents);

  const freeKm = settings.freeTravelKm > 0 ? km(settings.freeTravelKm) : null;
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
      ? `Op ${km(settings.freeTravelKm + extraKm)} km afstand betaal je ${formatEuro(
          Math.round(extraKm * multiplier * settings.pricePerKmCents),
        )} voorrijkosten.`
      : null;

  return {
    freeKm,
    free,
    over,
    example,
    max: `Wij komen tot ${km(settings.maxTravelKm)} km afstand.`,
    perKm,
    maxKm: km(settings.maxTravelKm),
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

export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
