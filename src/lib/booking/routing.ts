// Links and step names for the booking flow.

// Format of appointments.reference: "054-" followed by 8 hex characters.
const REFERENCE_PATTERN = /^054-[0-9A-F]{8}$/i;

export function isValidReference(value: string | undefined | null): value is string {
  return typeof value === "string" && REFERENCE_PATTERN.test(value);
}

// The status page is the customer's only way back to a booking, so the token travels in the link.
export function bookingStatusPath(reference: string, token: string): string {
  return `/boeking/${encodeURIComponent(reference)}?t=${encodeURIComponent(token)}`;
}

export function bookingThanksPath(reference: string): string {
  return `/boeking/bedankt?ref=${encodeURIComponent(reference)}`;
}

export const WIZARD_STEPS = ["Toestel", "Reparatie", "Adres", "Datum en tijd", "Gegevens", "Overzicht"] as const;
