"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { searchPdokAddresses } from "@/lib/booking/address";
import { loadModelOptions, loadPublicSettings } from "@/lib/booking/catalog";
import { CALENDAR_DAYS, getSiteUrl } from "@/lib/booking/config";
import { sendBookingConfirmation } from "@/lib/booking/confirmation";
import { BookingError, measureTravelKm } from "@/lib/booking/distance";
import { addDays, amsterdamDay } from "@/lib/booking/format";
import { bookingStatusPath } from "@/lib/booking/routing";
import { buildTravelQuote } from "@/lib/booking/pricing";
import { bookingCreatedSchema, bookingPayloadSchema, idSchema, type BookingPayload } from "@/lib/booking/schema";
import type {
  AddressSuggestion,
  DayAvailability,
  RepairOption,
  Result,
  TravelQuote,
} from "@/lib/booking/types";
import { createMolliePaymentForAppointment, isMollieConfigured } from "@/lib/payments/mollie";
import { createClient } from "@/lib/supabase/server";

const GENERIC_ERROR = "Er ging iets mis. Probeer het opnieuw.";
const BOOKING_UNAVAILABLE = "Boeken is tijdelijk niet beschikbaar.";

function failure<T extends object = object>(message: string, code?: "slot_taken"): Result<T> {
  return { ok: false, message, code };
}

// Errors from BookingError carry a Dutch message. Anything else gets a generic text.
function errorResult<T extends object = object>(error: unknown): Result<T> {
  if (error instanceof BookingError) {
    return failure<T>(error.message);
  }

  console.error(error);
  return failure<T>(GENERIC_ERROR);
}

function mollieReady(): Promise<boolean> {
  return isMollieConfigured().catch(() => false);
}

// Address suggestions while typing. Needs at least four characters.
export async function searchAddress(query: string): Promise<Result<{ suggestions: AddressSuggestion[] }>> {
  const parsed = z.string().trim().min(4).max(100).safeParse(query);

  if (!parsed.success) {
    return { ok: true, suggestions: [] };
  }

  try {
    return { ok: true, suggestions: await searchPdokAddresses(parsed.data) };
  } catch (error) {
    return errorResult(error);
  }
}

// Travel fee preview for a picked address. The same calculation runs again on booking.
export async function calculateTravel(lat: number, lng: number): Promise<Result<{ quote: TravelQuote }>> {
  const point = z
    .object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
    .safeParse({ lat, lng });

  if (!point.success) {
    return failure("Kies een adres uit de lijst.");
  }

  try {
    const supabase = await createClient();
    const settings = await loadPublicSettings(supabase);

    if (!settings) {
      return failure(BOOKING_UNAVAILABLE);
    }

    const { km, source } = await measureTravelKm(point.data, settings);
    return { ok: true, quote: buildTravelQuote(km, source, settings) };
  } catch (error) {
    return errorResult(error);
  }
}

// Priced repair combinations for the chosen model.
export async function getModelRepairOptions(modelId: string): Promise<Result<{ options: RepairOption[] }>> {
  const parsed = idSchema.safeParse(modelId);

  if (!parsed.success) {
    return failure("Kies eerst een model.");
  }

  try {
    const supabase = await createClient();
    const options = await loadModelOptions(supabase, parsed.data);

    if (!options) {
      return failure("De reparaties konden niet worden geladen. Probeer het opnieuw.");
    }

    return { ok: true, options };
  } catch (error) {
    return errorResult(error);
  }
}

// The next 60 days (Amsterdam), each marked open when at least one free start time exists.
export async function getAvailableDays(durationMinutes: number): Promise<Result<{ days: DayAvailability[] }>> {
  const duration = z.number().int().min(1).max(480).safeParse(durationMinutes);

  if (!duration.success) {
    return failure("De reparatietijd klopt niet. Ga terug en kies je reparatie opnieuw.");
  }

  try {
    const supabase = await createClient();
    const settings = await loadPublicSettings(supabase);

    if (!settings) {
      return failure(BOOKING_UNAVAILABLE);
    }

    const today = amsterdamDay(new Date());
    const dates = Array.from({ length: CALENDAR_DAYS }, (_, index) => addDays(today, index));
    const open = new Set<string>();

    // Chunks of ten keep the number of parallel requests low.
    for (let start = 0; start < dates.length; start += 10) {
      const chunk = dates.slice(start, start + 10);
      const results = await Promise.all(
        chunk.map((day) =>
          supabase.rpc("available_slots", {
            p_day: day,
            p_duration_minutes: duration.data,
            p_buffer_minutes: settings.travelBufferMinutes,
          }),
        ),
      );

      results.forEach((result, index) => {
        if (!result.error && Array.isArray(result.data) && result.data.length > 0) {
          open.add(chunk[index]);
        }
      });
    }

    return { ok: true, days: dates.map((date) => ({ date, open: open.has(date) })) };
  } catch (error) {
    return errorResult(error);
  }
}

// Free start times for one day, in UTC ISO strings. The page shows them in Amsterdam time.
export async function getSlots(dayIso: string, durationMinutes: number): Promise<Result<{ slots: string[] }>> {
  const input = z
    .object({
      day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      duration: z.number().int().min(1).max(480),
    })
    .safeParse({ day: dayIso, duration: durationMinutes });

  if (!input.success) {
    return failure("Kies een geldige dag.");
  }

  try {
    const today = amsterdamDay(new Date());

    if (input.data.day < today || input.data.day > addDays(today, CALENDAR_DAYS - 1)) {
      return failure("Deze dag kun je niet kiezen.");
    }

    const supabase = await createClient();
    const settings = await loadPublicSettings(supabase);

    if (!settings) {
      return failure(BOOKING_UNAVAILABLE);
    }

    const { data, error } = await supabase.rpc("available_slots", {
      p_day: input.data.day,
      p_duration_minutes: input.data.duration,
      p_buffer_minutes: settings.travelBufferMinutes,
    });

    if (error) {
      return failure("De tijden konden niet worden geladen. Probeer het opnieuw.");
    }

    const rows = z.array(z.object({ slot_start: z.string() })).safeParse(data);

    if (!rows.success) {
      return failure("De tijden konden niet worden geladen. Probeer het opnieuw.");
    }

    const slots = rows.data
      .map((row) => row.slot_start)
      .sort((a, b) => Date.parse(a) - Date.parse(b));

    return { ok: true, slots };
  } catch (error) {
    return errorResult(error);
  }
}

// Books the appointment. Prices, durations and availability are checked in the database.
// On success the customer is redirected: to Mollie when payments are active, otherwise to the status page.
export async function createBookingAction(input: BookingPayload): Promise<Result> {
  const parsed = bookingPayloadSchema.safeParse(input);

  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Controleer je gegevens.");
  }

  const payload = parsed.data;
  let target: string | null = null;

  try {
    const supabase = await createClient();
    const settings = await loadPublicSettings(supabase);

    if (!settings) {
      return failure(BOOKING_UNAVAILABLE);
    }

    const paymentReady = await mollieReady();
    // Resolved before the booking exists, so a missing site URL never leaves a booking without a payment link.
    const siteUrl = paymentReady ? await getSiteUrl() : null;

    // The distance is measured again on the server. The client value is never trusted.
    const { km, source } = await measureTravelKm(payload.address, settings);

    if (!buildTravelQuote(km, source, settings).withinArea) {
      return failure("Dit adres ligt buiten ons werkgebied.");
    }

    const { data, error } = await supabase.rpc("create_booking", {
      p_model_id: payload.modelId,
      p_items: payload.items,
      p_customer_name: payload.customer.name,
      p_customer_phone: payload.customer.phone,
      p_customer_email: payload.customer.email,
      p_customer_note: payload.customer.note || null,
      p_street: payload.address.street,
      p_house_number: payload.address.houseNumber,
      p_postcode: payload.address.postcode,
      p_city: payload.address.city,
      p_lat: payload.address.lat,
      p_lng: payload.address.lng,
      p_travel_km: km,
      p_starts_at: payload.startsAt,
      p_payment_choice: payload.paymentChoice,
      p_requires_payment: paymentReady,
    });

    if (error) {
      // P0001 = a RAISE EXCEPTION in the database, whose message is already Dutch.
      if (error.code !== "P0001") {
        console.error(error);
        return failure(GENERIC_ERROR);
      }

      return failure(error.message, /tijdslot/i.test(error.message) ? "slot_taken" : undefined);
    }

    const booking = bookingCreatedSchema.safeParse(data);

    if (!booking.success) {
      return failure(GENERIC_ERROR);
    }

    const { reference, token, startsAt, totalCents, depositCents } = booking.data;
    const statusPath = bookingStatusPath(reference, token);

    if (siteUrl) {
      try {
        const payment = await createMolliePaymentForAppointment({
          reference,
          amountCents: depositCents,
          kind: payload.paymentChoice,
          description: `054repairs reparatie ${reference}`,
          redirectUrl: `${siteUrl}${statusPath}`,
        });
        target = payment.checkoutUrl;
      } catch (paymentError) {
        // The booking is kept. The status page offers a new payment link.
        console.error(paymentError);
        target = `${statusPath}&betaling=mislukt`;
      }
    } else {
      target = statusPath;
    }

    await sendBookingConfirmation({
      to: payload.customer.email,
      customerName: payload.customer.name,
      reference,
      token,
      startsAt,
      totalCents,
      depositCents,
      paymentChoice: payload.paymentChoice,
      paymentPending: paymentReady,
    });
  } catch (error) {
    return errorResult(error);
  }

  if (!target) {
    return failure(GENERIC_ERROR);
  }

  // Outside the try block: redirect() works by throwing.
  redirect(target);
}
