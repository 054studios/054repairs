import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, serverSecretsConfigured } from "@/lib/supabase/admin";
import { ROUTE_API_URL } from "./config";
import type { PublicSettings } from "./types";

// Errors with a message that can be shown to the customer as is.
export class BookingError extends Error {}

type Point = { lat: number; lng: number };

const ROUTE_FAILED = "Afstand kon niet worden berekend. Probeer het opnieuw.";
const NO_START_POINT = "Het startpunt is nog niet ingesteld.";

export function roundKm(km: number): number {
  return Math.round(km * 10) / 10;
}

// The start point is private. It is read only with the service role, on the server.
async function readStartPoint(): Promise<Point | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("settings")
    .select("start_lat, start_lng")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new BookingError(ROUTE_FAILED);
  }

  if (!data || data.start_lat == null || data.start_lng == null) {
    return null;
  }

  return { lat: Number(data.start_lat), lng: Number(data.start_lng) };
}

const routeSchema = z.object({
  code: z.string(),
  routes: z.array(z.object({ distance: z.number() })).optional(),
});

// Driving distance from OSRM (public demo server). Returns km, one decimal.
async function routeKm(from: Point, to: Point): Promise<number> {
  const url = `${ROUTE_API_URL}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;

  let response: Response;

  try {
    response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  } catch {
    throw new BookingError(ROUTE_FAILED);
  }

  if (!response.ok) {
    throw new BookingError(ROUTE_FAILED);
  }

  const parsed = routeSchema.safeParse(await response.json());
  const meters = parsed.success ? parsed.data.routes?.[0]?.distance : undefined;

  if (!parsed.success || parsed.data.code !== "Ok" || meters === undefined) {
    throw new BookingError(ROUTE_FAILED);
  }

  return roundKm(meters / 1000);
}

// Distance used for the travel fee.
// With the service role: the exact driving distance from the start point.
// Without it: an estimate from the database (straight line x 1.3). The start point never leaves the database.
export async function measureTravelKm(
  target: Point,
  settings: PublicSettings,
): Promise<{ km: number; source: "route" | "estimate" }> {
  if (!settings.hasStartPoint) {
    throw new BookingError(NO_START_POINT);
  }

  if (serverSecretsConfigured()) {
    const start = await readStartPoint();

    if (!start) {
      throw new BookingError(NO_START_POINT);
    }

    return { km: await routeKm(start, target), source: "route" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("estimate_travel_km", {
    p_lat: target.lat,
    p_lng: target.lng,
  });

  if (error) {
    throw new BookingError(ROUTE_FAILED);
  }

  if (data === null || data === undefined) {
    throw new BookingError(NO_START_POINT);
  }

  return { km: roundKm(Number(data)), source: "estimate" };
}
