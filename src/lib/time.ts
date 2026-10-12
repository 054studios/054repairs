export const SHOP_TIME_ZONE = "Europe/Amsterdam";

// Converts a "YYYY-MM-DDTHH:mm" value typed in Amsterdam time to an ISO string in UTC.
export function amsterdamLocalToIso(local: string): string {
  const match = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);

  if (!match) {
    throw new Error("Vul een geldige datum en tijd in.");
  }

  const [, y, mo, d, h, mi] = match.map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SHOP_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(asUtc));

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const shownAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  const offset = shownAsUtc - asUtc;

  return new Date(asUtc - offset).toISOString();
}

export function formatShopDateTime(iso: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    timeZone: SHOP_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export const WEEKDAYS = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
