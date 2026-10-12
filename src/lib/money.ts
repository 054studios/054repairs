// Money is stored in cents. Admins type euros, with a comma or a dot.

export function parseEuroToCents(raw: string): number | null {
  const value = raw.trim().replace(",", ".");

  if (value === "") {
    return null;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    throw new Error(`Ongeldig bedrag "${raw}". Vul bijvoorbeeld 49,95 in.`);
  }

  return Math.round(Number(value) * 100);
}

export function centsToEuroInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) {
    return "";
  }

  return (cents / 100).toFixed(2).replace(".", ",");
}

export function formatEuro(cents: number): string {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
}
