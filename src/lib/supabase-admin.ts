import "server-only";
import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getUploadContext() {
  const supabase = createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return {
    bucket: process.env.SUPABASE_BUCKET ?? "wedding-photos",
    eventDate: process.env.WEDDING_DATE ?? "2026-06-01",
    metadataTable: process.env.SUPABASE_PHOTOS_TABLE?.trim(),
    supabase,
  };
}
