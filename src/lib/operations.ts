import { z } from "zod";
export const CHECK_LABELS = {
  touchscreen: "Touchscreen",
  camera: "Camera",
  charging: "Opladen",
  sound: "Geluid",
} as const;
export const CHECK_RESULTS = {
  pass: "In orde",
  fail: "Aandachtspunt",
  not_tested: "Niet getest",
} as const;
export const checksSchema = z.object({
  touchscreen: z.enum(["pass", "fail", "not_tested"]),
  camera: z.enum(["pass", "fail", "not_tested"]),
  charging: z.enum(["pass", "fail", "not_tested"]),
  sound: z.enum(["pass", "fail", "not_tested"]),
});
export const reportSchema = z.object({
  checks: checksSchema,
  notes: z.string(),
  updatedAt: z.string(),
});
export const invoiceSchema = z.object({
  number: z.string(),
  issuedAt: z.string(),
  snapshot: z.object({
    legalName: z.string(),
    businessAddress: z.string(),
    kvk: z.string(),
    vatNumber: z.string(),
    vatPercent: z.number(),
    taxNote: z.string(),
    customerName: z.string(),
    customerAddress: z.string(),
    reference: z.string(),
    model: z.string(),
    serviceDate: z.string(),
    items: z.array(
      z.object({
        name: z.string(),
        qualityName: z.string(),
        priceCents: z.number(),
      }),
    ),
    travelCents: z.number(),
    totalCents: z.number(),
    netCents: z.number(),
    vatCents: z.number(),
  }),
});
export const documentsSchema = z.object({
  reference: z.string(),
  customerName: z.string(),
  model: z.string(),
  report: reportSchema.nullable(),
  invoice: invoiceSchema.nullable(),
});
export function estimatedMinutes(
  lat1: number | null,
  lng1: number | null,
  lat2: number | null,
  lng2: number | null,
  speed: number,
  margin: number,
) {
  if (lat1 === null || lng1 === null || lat2 === null || lng2 === null)
    return null;
  const rad = (v: number) => (v * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) *
      Math.cos(rad(lat2)) *
      Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return (
    Math.ceil(
      ((2 * 6371 * Math.asin(Math.sqrt(Math.min(1, a))) * 1.3) / speed) * 60,
    ) + margin
  );
}
export function safeHttps(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
}
