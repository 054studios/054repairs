import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { getServerEnv } from "@/lib/env.server";

// Service role client. Bypasses RLS, so use it only for server-side work that
// no signed-in admin should do directly (for example, the encrypted Mollie key).
export function createAdminClient() {
  const serverEnv = getServerEnv();

  if (!serverEnv) {
    throw new Error(
      "Serverinstellingen ontbreken. Voeg SUPABASE_SERVICE_ROLE_KEY en APP_ENCRYPTION_KEY toe.",
    );
  }

  return createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function serverSecretsConfigured(): boolean {
  return getServerEnv() !== null;
}
