import "server-only";
import { z } from "zod";
import { PDOK_FREE_URL } from "./config";
import { BookingError } from "./distance";
import { formatPostcode } from "./format";
import type { AddressSuggestion } from "./types";

const FIELDS = [
  "weergavenaam",
  "straatnaam",
  "huisnummer",
  "huisletter",
  "huisnummertoevoeging",
  "postcode",
  "woonplaatsnaam",
  "centroide_ll",
].join(",");

const docSchema = z.object({
  weergavenaam: z.string(),
  straatnaam: z.string().optional(),
  huisnummer: z.union([z.string(), z.number()]).optional(),
  huisletter: z.string().optional(),
  huisnummertoevoeging: z.union([z.string(), z.number()]).optional(),
  postcode: z.string().optional(),
  woonplaatsnaam: z.string().optional(),
  centroide_ll: z.string().optional(),
});

const responseSchema = z.object({
  response: z.object({ docs: z.array(z.unknown()) }),
});

const SEARCH_FAILED = "Adressen zoeken lukt nu niet. Probeer het opnieuw.";

// Address suggestions from PDOK Locatieserver (free, Dutch addresses only).
// Returns at most five addresses with coordinates, so the customer can pick one.
export async function searchPdokAddresses(query: string): Promise<AddressSuggestion[]> {
  const url = new URL(PDOK_FREE_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("rows", "5");
  url.searchParams.set("fq", "type:adres");
  url.searchParams.set("fl", FIELDS);

  let response: Response;

  try {
    response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  } catch {
    throw new BookingError(SEARCH_FAILED);
  }

  if (!response.ok) {
    throw new BookingError(SEARCH_FAILED);
  }

  const body = responseSchema.safeParse(await response.json());

  if (!body.success) {
    throw new BookingError(SEARCH_FAILED);
  }

  const suggestions: AddressSuggestion[] = [];

  for (const raw of body.data.response.docs) {
    const parsed = docSchema.safeParse(raw);

    if (!parsed.success) {
      continue;
    }

    const doc = parsed.data;
    const point = doc.centroide_ll?.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);

    if (!point || doc.straatnaam === undefined || doc.postcode === undefined || doc.huisnummer === undefined || doc.woonplaatsnaam === undefined) {
      continue;
    }

    const addition = doc.huisnummertoevoeging ? ` ${doc.huisnummertoevoeging}` : "";

    suggestions.push({
      label: doc.weergavenaam,
      street: doc.straatnaam,
      houseNumber: `${doc.huisnummer}${doc.huisletter ?? ""}${addition}`,
      postcode: formatPostcode(doc.postcode),
      city: doc.woonplaatsnaam,
      lng: Number(point[1]),
      lat: Number(point[2]),
    });
  }

  return suggestions.slice(0, 5);
}
