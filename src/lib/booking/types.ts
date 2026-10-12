// Shared booking types. Safe to import from client and server code.

export type PaymentChoice = "deposit" | "full";

// Mirrors public.public_settings(). The start address is never included.
export type PublicSettings = {
  businessName: string;
  phone: string | null;
  email: string | null;
  freeTravelKm: number;
  maxTravelKm: number;
  pricePerKmCents: number;
  travelDistanceMode: "round_trip" | "one_way";
  depositType: "fixed" | "percent";
  depositValue: number;
  allowFullPrepay: boolean;
  fullRefundHours: number;
  lateCancelRefundPercent: number;
  travelBufferMinutes: number;
  slotStepMinutes: number;
  bookingLeadHours: number;
  hasStartPoint: boolean;
};

export type Brand = { id: string; name: string };

export type DeviceModel = { id: string; brandId: string; name: string };

export type RepairType = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
};

export type RepairQuality = { id: string; name: string; description: string | null };

// One priced combination from repair_prices for the chosen model.
// durationMinutes is already resolved (price row, or the repair type default).
export type RepairOption = {
  repairTypeId: string;
  qualityId: string;
  priceCents: number;
  durationMinutes: number;
};

export type BookingCatalog = {
  brands: Brand[];
  models: DeviceModel[];
  repairTypes: RepairType[];
  qualities: RepairQuality[];
  settings: PublicSettings;
  mollieReady: boolean;
};

export type AddressSuggestion = {
  label: string;
  street: string;
  houseNumber: string;
  postcode: string;
  city: string;
  lat: number;
  lng: number;
};

export type TravelQuote = {
  // Distance used for the fee, rounded to one decimal (same value sent to create_booking).
  km: number;
  // "route" = OSRM driving distance. "estimate" = straight line, used while the start point is not readable.
  source: "route" | "estimate";
  billableKm: number;
  feeCents: number;
  freeTravelKm: number;
  maxTravelKm: number;
  pricePerKmCents: number;
  roundTrip: boolean;
  withinArea: boolean;
};

export type DayAvailability = { date: string; open: boolean };

// Every server action returns this shape. Errors carry a Dutch message for the customer.
export type Result<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; message: string; code?: "slot_taken" };
