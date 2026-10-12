import "server-only";
import { headers } from "next/headers";

// Number of days shown in the calendar.
export const CALENDAR_DAYS = 60;

export const ROUTE_API_URL = "https://router.project-osrm.org/route/v1/driving";
export const PDOK_FREE_URL = "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free";

// Public base URL of the site, without a trailing slash. Needed for Mollie redirects and email links.
// Falls back to the request host, so local testing works without NEXT_PUBLIC_SITE_URL.
export async function getSiteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("De websitelink ontbreekt. Stel NEXT_PUBLIC_SITE_URL in.");
  }

  return `${protocol}://${host}`;
}
