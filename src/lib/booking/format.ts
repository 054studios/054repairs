// Date, time and number formatting for the booking flow. Shop times are Amsterdam time.
import { SHOP_TIME_ZONE, WEEKDAYS } from "@/lib/time";

const MONTHS = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

const clockFormat = new Intl.DateTimeFormat("nl-NL", {
  timeZone: SHOP_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

const dateTimeFormat = new Intl.DateTimeFormat("nl-NL", {
  timeZone: SHOP_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatClock(iso: string): string {
  return clockFormat.format(new Date(iso));
}

export function formatWindow(startIso: string, endIso: string): string {
  return `${formatClock(startIso)} – ${formatClock(endIso)}`;
}

export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

// "YYYY-MM-DD" for the Amsterdam calendar day of the given moment.
export function amsterdamDay(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHOP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function parseDay(dayIso: string): { year: number; month: number; day: number } {
  const [year, month, day] = dayIso.split("-").map(Number);
  return { year, month, day };
}

export function addDays(dayIso: string, amount: number): string {
  const { year, month, day } = parseDay(dayIso);
  return new Date(Date.UTC(year, month - 1, day + amount)).toISOString().slice(0, 10);
}

// 0 = Monday, 6 = Sunday. Used to line up calendar weeks.
export function weekdayIndexMonday(dayIso: string): number {
  const { year, month, day } = parseDay(dayIso);
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

export function formatDayLong(dayIso: string): string {
  const { year, month, day } = parseDay(dayIso);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday} ${day} ${MONTHS[month - 1]}`;
}

export function monthTitle(dayIso: string): string {
  const { year, month } = parseDay(dayIso);
  const name = MONTHS[month - 1];
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} uur` : `${hours} uur ${rest} min`;
}

export function formatKm(km: number): string {
  const text = Number.isInteger(km) ? String(km) : km.toFixed(1).replace(".", ",");
  return `${text} km`;
}

export function formatPostcode(postcode: string): string {
  return postcode.replace(/^(\d{4})\s?([A-Za-z]{2})$/, "$1 $2").toUpperCase();
}

// True when the appointment has started. Call only at request time, never during prerendering.
export function hasBookingStarted(startsAtIso: string): boolean {
  return Date.parse(startsAtIso) <= Date.now();
}

// Adds minutes to an ISO moment and returns the ISO result.
export function addMinutesIso(iso: string, minutes: number): string {
  return new Date(Date.parse(iso) + minutes * 60_000).toISOString();
}
