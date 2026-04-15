import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getUploadContext } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function resolveExtension(file: File) {
  const mimeTypeMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  if (mimeTypeMap[file.type]) {
    return mimeTypeMap[file.type];
  }

  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  return fileExtension && fileExtension.length <= 5 ? fileExtension : "jpg";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const photo = formData.get("photo");
    const guestNameValue = formData.get("guestName");

    if (!(photo instanceof File)) {
      return NextResponse.json(
        { error: "Please choose a photo first." },
        { status: 400 },
      );
    }

    if (!photo.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image uploads are supported." },
        { status: 400 },
      );
    }

    if (photo.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Photo is too large. Please try a smaller image." },
        { status: 400 },
      );
    }

    const { bucket, eventDate, metadataTable, supabase } = getUploadContext();
    const filePath = `${eventDate}/${Date.now()}-${randomUUID()}.${resolveExtension(photo)}`;
    const fileBuffer = Buffer.from(await photo.arrayBuffer());
    const guestName =
      typeof guestNameValue === "string" && guestNameValue.trim()
        ? guestNameValue.trim().slice(0, 80)
        : null;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        cacheControl: "3600",
        contentType: photo.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    if (metadataTable) {
      const { error: insertError } = await supabase.from(metadataTable).insert({
        file_path: filePath,
        guest_name: guestName,
      });

      if (insertError) {
        console.warn("Metadata insert failed:", insertError.message);
      }
    }

    return NextResponse.json({ ok: true, path: filePath });
  } catch (error) {
    console.error("Upload failed:", error);

    return NextResponse.json(
      { error: "Something went wrong, try again." },
      { status: 500 },
    );
  }
}
