// Dutch labels for appointment and payment statuses (customer-facing).
import type { ChipTone } from "@/components/ui/styles";

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  new: "Ontvangen",
  confirmed: "Bevestigd",
  picked_up: "Toestel opgehaald",
  in_repair: "In reparatie",
  ready: "Klaar",
  returned: "Teruggebracht",
  cancelled: "Geannuleerd",
  expired: "Verlopen",
};

// Headline on the status page, one per status.
export const APPOINTMENT_STATUS_HEADLINES: Record<string, string> = {
  new: "Wij hebben je boeking ontvangen",
  confirmed: "Je afspraak staat vast",
  picked_up: "Je toestel is bij ons",
  in_repair: "Wij repareren je toestel",
  ready: "Je toestel is klaar",
  returned: "Je hebt je toestel terug",
  cancelled: "Deze afspraak is geannuleerd",
  expired: "Deze reservering is verlopen",
};

// The route a booking travels, in order. Cancelled and expired leave the route.
export const STATUS_ROUTE = [
  "new",
  "confirmed",
  "picked_up",
  "in_repair",
  "ready",
  "returned",
] as const;

// One line under the current stop of the route.
export const STATUS_ROUTE_TEXT: Record<string, string> = {
  new: "Je boeking is vastgelegd. Wij bevestigen de afspraak.",
  confirmed: "Wij komen op het afgesproken tijdstip naar je adres.",
  picked_up: "Je toestel is bij de monteur voor de reparatie.",
  in_repair: "De reparatie is bezig, vlak bij je adres.",
  ready: "De reparatie is klaar. Wij brengen je toestel zo terug.",
  returned: "De afspraak is afgerond.",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Nog niet betaald",
  deposit_paid: "Aanbetaling ontvangen",
  paid: "Volledig betaald",
  refunded: "Terugbetaald",
};

export const PAYMENT_STATUS_TONES: Record<string, ChipTone> = {
  unpaid: "warn",
  deposit_paid: "info",
  paid: "ok",
  refunded: "neutral",
};

// Statuses in which the customer can no longer cancel.
export const FINAL_STATUSES = ["cancelled", "expired", "returned"];
