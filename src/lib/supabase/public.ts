import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

// Anonymous client without cookies. Use it for public, non-personal reads
// (catalogue, public settings), so those pages can be cached and prerendered.
export function createPublicClient() {
  return createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
