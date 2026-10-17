import "server-only";
import {
  createAdminClient,
  serverSecretsConfigured,
} from "@/lib/supabase/admin";
export const funnelEvents = [
  "step_1",
  "step_2",
  "step_3",
  "step_4",
  "step_5",
  "step_6",
  "booking_created",
  "booking_failed",
  "payment_failed",
  "payment_paid",
] as const;
export type FunnelEvent = (typeof funnelEvents)[number];
export async function recordMetric(event: FunnelEvent): Promise<boolean> {
  if (
    process.env.NEXT_PUBLIC_FUNNEL_ENABLED !== "true" ||
    !serverSecretsConfigured()
  )
    return false;
  try {
    const { error } = await createAdminClient().rpc("record_funnel_event", {
      p_event: event,
    });
    if (error) {
      console.error("Boekingsmeting kon niet worden opgeslagen", error.code);
      return false;
    }
    return true;
  } catch {
    console.error("Boekingsmeting niet beschikbaar");
    return false;
  }
}
