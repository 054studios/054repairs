// Labels and small helpers for the appointment pages. No server-only imports here,
// so client components can use the types.

import type { ActionResult } from "@/lib/action-result";
import { chipClass, type ChipTone } from "@/components/ui/styles";

// Statuses an admin can choose. "expired" is set by the system when a hold runs out.
export const ADMIN_STATUSES = ["new", "confirmed", "picked_up", "in_repair", "ready", "returned", "cancelled"] as const;

export const INACTIVE_STATUSES = ["cancelled", "expired"] as const;

export const CANCEL_REASON = "Geannuleerd door monteur";

export const STATUS_LABEL: Record<string, string> = {
  new: "Nieuw",
  confirmed: "Bevestigd",
  picked_up: "Opgehaald",
  in_repair: "In reparatie",
  ready: "Klaar",
  returned: "Teruggebracht",
  cancelled: "Geannuleerd",
  expired: "Verlopen",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  unpaid: "Onbetaald",
  deposit_paid: "Aanbetaling betaald",
  paid: "Volledig betaald",
  refunded: "Terugbetaald",
};

export const PROVIDER_LABEL: Record<string, string> = {
  mollie: "Mollie",
  pin: "Pin",
  cash: "Contant",
};

export const KIND_LABEL: Record<string, string> = {
  deposit: "Aanbetaling",
  full: "Volledige betaling",
  balance: "Restbedrag",
  refund: "Terugbetaling",
};

export const PAYMENT_STATUS_RECORD_LABEL: Record<string, string> = {
  open: "Open",
  pending: "In behandeling",
  paid: "Betaald",
  failed: "Mislukt",
  expired: "Verlopen",
  canceled: "Geannuleerd",
  refunded: "Terugbetaald",
};

// The list filters. "active" groups the states while the repair is under way.
export type StatusFilter = {
  key: string;
  label: string;
  statuses: readonly string[] | null;
};

export const STATUS_FILTERS: readonly StatusFilter[] = [
  { key: "all", label: "Alle", statuses: null },
  { key: "new", label: "Nieuw", statuses: ["new"] },
  { key: "confirmed", label: "Bevestigd", statuses: ["confirmed"] },
  { key: "active", label: "Actief", statuses: ["picked_up", "in_repair", "ready"] },
  { key: "returned", label: "Teruggebracht", statuses: ["returned"] },
  { key: "cancelled", label: "Geannuleerd", statuses: ["cancelled", "expired"] },
];

export function isInactive(status: string): boolean {
  return (INACTIVE_STATUSES as readonly string[]).includes(status);
}

// Chip tones carry meaning: new needs a look, the repair under way needs attention,
// ready is good to go, a cancelled or expired booking is off the road.
const STATUS_TONE: Record<string, ChipTone> = {
  new: "info",
  confirmed: "neutral",
  picked_up: "warn",
  in_repair: "warn",
  ready: "ok",
  returned: "neutral",
  cancelled: "bad",
  expired: "bad",
};

export function statusBadgeClass(status: string): string {
  return `${chipClass(STATUS_TONE[status] ?? "neutral")} shrink-0 whitespace-nowrap`;
}

const PAYMENT_STATUS_TONE: Record<string, ChipTone> = {
  unpaid: "warn",
  deposit_paid: "neutral",
  paid: "ok",
  refunded: "neutral",
};

export function paymentStatusBadgeClass(status: string): string {
  return `${chipClass(PAYMENT_STATUS_TONE[status] ?? "neutral")} shrink-0 whitespace-nowrap`;
}

const PAYMENT_RECORD_TONE: Record<string, ChipTone> = {
  open: "neutral",
  pending: "neutral",
  paid: "ok",
  failed: "bad",
  expired: "bad",
  canceled: "bad",
  refunded: "neutral",
};

export function paymentRecordBadgeClass(status: string): string {
  return `${chipClass(PAYMENT_RECORD_TONE[status] ?? "neutral")} shrink-0 whitespace-nowrap`;
}

export function outstandingCents(totalCents: number, paidCents: number): number {
  return Math.max(0, totalCents - paidCents);
}

// Dutch phone numbers in any notation, as a tel: link.
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function mapsSearchHref(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

// Result of the Mollie balance link action. The page shows the link for copying.
export type MollieLinkResult = ActionResult & { checkoutUrl?: string };
