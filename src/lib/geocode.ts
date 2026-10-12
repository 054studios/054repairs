import "server-only";

// PDOK Locatieserver: free, no key needed, Dutch addresses only.
export async function geocodeAddress(query: string): Promise<{ label: string; lat: number; lng: number } | null> {
  const url = new URL("https://api.pdok.nl/bzk/locatieserver/search/v3_1/free");
  url.searchParams.set("q", query);
  url.searchParams.set("rows", "1");
  url.searchParams.set("fl", "weergavenaam,centroide_ll");

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Het adres kon niet worden opgezocht. Probeer het later opnieuw.");
  }

  const data = (await response.json()) as {
    response?: { docs?: Array<{ weergavenaam?: string; centroide_ll?: string }> };
  };
  const doc = data.response?.docs?.[0];
  const match = doc?.centroide_ll?.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);

  if (!doc?.weergavenaam || !match) {
    return null;
  }

  return { label: doc.weergavenaam, lng: Number(match[1]), lat: Number(match[2]) };
}
