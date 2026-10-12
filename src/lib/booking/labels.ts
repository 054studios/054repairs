// Dutch labels for appointment and payment statuses (customer-facing).

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

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Nog niet betaald",
  deposit_paid: "Aanbetaling ontvangen",
  paid: "Volledig betaald",
  refunded: "Terugbetaald",
};

// Statuses in which the customer can no longer cancel.
export const FINAL_STATUSES = ["cancelled", "expired", "returned"];
