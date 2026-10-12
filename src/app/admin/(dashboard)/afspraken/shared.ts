// Labels and small helpers for the appointment pages. No server-only imports here,
// so client components can use the types.

import type { ActionResult } from "@/lib/action-result";

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

export function statusBadgeClass(status: string): string {
  const tone: Record<string, string> = {
    new: "bg-amber-100 text-amber-900",
    confirmed: "bg-navy-100 text-navy-900",
    picked_up: "bg-sky-100 text-sky-900",
    in_repair: "bg-sky-100 text-sky-900",
    ready: "bg-sky-100 text-sky-900",
    returned: "bg-emerald-100 text-emerald-900",
    cancelled: "bg-red-100 text-red-800",
    expired: "bg-navy-100 text-navy-600",
  };

  return `inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tone[status] ?? "bg-navy-100 text-navy-700"}`;
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
