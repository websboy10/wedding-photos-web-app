import "server-only";
import { createHash } from "node:crypto";
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
    galleryPassword: process.env.GALLERY_PASSWORD ?? "Kokomand123",
    metadataTable: process.env.SUPABASE_PHOTOS_TABLE?.trim(),
    supabase,
  };
}

export function getGalleryCookieValue(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

type StorageItem = {
  id?: string | null;
  name: string;
};

function isImageFile(item: StorageItem) {
  return /\.(avif|heic|jpeg|jpg|png|webp)$/i.test(item.name);
}

export async function listEventPhotos() {
  const { bucket, eventDate, supabase } = getUploadContext();
  const items: StorageItem[] = [];
  const pageSize = 100;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.storage.from(bucket).list(eventDate, {
      limit: pageSize,
      offset,
      sortBy: {
        column: "name",
        order: "desc",
      },
    });

    if (error) {
      throw error;
    }

    const batch = (data ?? []) as StorageItem[];
    items.push(...batch.filter((item) => item.id && isImageFile(item)));

    if (batch.length < pageSize) {
      break;
    }
  }

  if (items.length === 0) {
    return [];
  }

  const filePaths = items.map((item) => `${eventDate}/${item.name}`);
  const { data: signedUrls, error: signedUrlError } =
    await supabase.storage.from(bucket).createSignedUrls(filePaths, 60 * 60);

  if (signedUrlError) {
    throw signedUrlError;
  }

  return signedUrls
    .filter((entry) => entry.signedUrl)
    .map((entry, index) => ({
      name: items[index]?.name ?? `photo-${index + 1}`,
      path: filePaths[index] ?? "",
      signedUrl: entry.signedUrl,
    }));
}
