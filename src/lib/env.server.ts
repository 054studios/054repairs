import "server-only";
import { z } from "zod";

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // 32+ random characters. Used to encrypt the Mollie API key at rest.
  APP_ENCRYPTION_KEY: z.string().min(32),
});

export const serverEnv = serverSchema.parse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  APP_ENCRYPTION_KEY: process.env.APP_ENCRYPTION_KEY,
});
