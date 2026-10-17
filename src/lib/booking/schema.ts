// Validation shared by the client (early feedback) and the server (the real check).
import { z } from "zod";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const idSchema = z.string().regex(UUID_PATTERN, "Ongeldige keuze. Probeer het opnieuw.");

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Vul je naam in.").max(100, "Je naam is te lang."),
  phone: z
    .string()
    .trim()
    .max(40, "Controleer je telefoonnummer.")
    .refine((value) => value.replace(/\D/g, "").length >= 6, "Vul een geldig telefoonnummer in."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Vul een geldig e-mailadres in." })),
  note: z.string().trim().max(500, "Je opmerking is te lang.").default(""),
});

export const addressSchema = z.object({
  street: z.string().trim().min(2, "Kies een adres uit de lijst.").max(120),
  houseNumber: z.string().trim().min(1, "Kies een adres uit de lijst.").max(20),
  postcode: z
    .string()
    .transform((value) => value.replace(/\s+/g, "").toUpperCase())
    .pipe(z.string().regex(/^\d{4}[A-Z]{2}$/, "Kies een adres uit de lijst.")),
  city: z.string().trim().min(2, "Kies een adres uit de lijst.").max(80),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const bookingPayloadSchema = z.object({
  website: z.string().max(0, "Boeken lukt niet. Neem contact met ons op.").optional(),
  modelId: idSchema,
  items: z
    .array(z.object({ repairTypeId: idSchema, qualityId: idSchema }))
    .min(1, "Kies minimaal één reparatie.")
    .max(10, "Kies maximaal tien reparaties.")
    .refine(
      (items) => new Set(items.map((item) => item.repairTypeId)).size === items.length,
      "Kies per reparatie maar één kwaliteit.",
    ),
  address: addressSchema,
  startsAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Kies een datum en tijd."),
  customer: customerSchema,
  paymentChoice: z.enum(["deposit", "full"]),
});

export type BookingPayload = z.input<typeof bookingPayloadSchema>;
export type CustomerInput = z.input<typeof customerSchema>;

// Row shapes returned by PostgREST. Only the fields the site uses.
export const brandRowSchema = z.object({ id: z.string(), name: z.string() });

export const modelRowSchema = z.object({
  id: z.string(),
  brand_id: z.string(),
  name: z.string(),
});

export const repairTypeRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  duration_minutes: z.number(),
});

export const qualityRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
});

export const priceRowSchema = z.object({
  repair_type_id: z.string(),
  quality_id: z.string(),
  price_cents: z.number(),
  duration_minutes: z.number().nullish(),
});

export const publicSettingsSchema = z.object({
  businessName: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
  freeTravelKm: z.number(),
  maxTravelKm: z.number(),
  pricePerKmCents: z.number(),
  travelDistanceMode: z.enum(["round_trip", "one_way"]),
  depositType: z.enum(["fixed", "percent"]),
  depositValue: z.number(),
  allowFullPrepay: z.boolean(),
  fullRefundHours: z.number(),
  lateCancelRefundPercent: z.number(),
  travelBufferMinutes: z.number(),
  slotStepMinutes: z.number(),
  bookingLeadHours: z.number(),
  hasStartPoint: z.boolean(),
});

// Returned by public.create_booking.
export const bookingCreatedSchema = z.object({
  reference: z.string(),
  token: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  totalCents: z.number(),
  depositCents: z.number(),
  travelFeeCents: z.number(),
});

// Returned by public.get_booking_status (null when reference and token do not match).
export const bookingStatusSchema = z.object({
  reference: z.string(),
  status: z.string(),
  paymentStatus: z.string(),
  paymentChoice: z.enum(["deposit", "full"]),
  startsAt: z.string(),
  endsAt: z.string(),
  modelLabel: z.string(),
  items: z.array(
    z.object({
      repairTypeId: z.string(),
      name: z.string(),
      qualityName: z.string(),
      priceCents: z.number(),
      durationMinutes: z.number(),
    }),
  ),
  street: z.string(),
  houseNumber: z.string(),
  postcode: z.string(),
  city: z.string(),
  customerName: z.string(),
  travelFeeCents: z.number(),
  totalCents: z.number(),
  depositCents: z.number(),
  paidCents: z.number(),
  cancelledAt: z.string().nullish(),
  holdExpiresAt: z.string().nullish(),
});

export type BookingStatus = z.infer<typeof bookingStatusSchema>;
