import "server-only";
import { cookies } from "next/headers";
import { getGalleryCookieValue, getUploadContext } from "@/lib/supabase-admin";

export const GALLERY_COOKIE_NAME = "wedding-gallery-access";

export async function hasGalleryAccess() {
  const cookieStore = await cookies();
  const accessCookie = cookieStore.get(GALLERY_COOKIE_NAME)?.value;

  if (!accessCookie) {
    return false;
  }

  const { galleryPassword } = getUploadContext();
  return accessCookie === getGalleryCookieValue(galleryPassword);
}
