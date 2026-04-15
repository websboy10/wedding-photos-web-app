import { NextResponse } from "next/server";
import {
  getGalleryCookieValue,
  getUploadContext,
} from "@/lib/supabase-admin";
import { GALLERY_COOKIE_NAME } from "@/lib/gallery-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password =
    typeof formData.get("password") === "string"
      ? formData.get("password")?.toString()
      : "";
  const { galleryPassword } = getUploadContext();
  const redirectUrl = new URL("/brudepar", request.url);

  if (password !== galleryPassword) {
    redirectUrl.searchParams.set("error", "1");
    return NextResponse.redirect(redirectUrl, 303);
  }

  const response = NextResponse.redirect(redirectUrl, 303);

  response.cookies.set({
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    name: GALLERY_COOKIE_NAME,
    path: "/",
    sameSite: "lax",
    secure: true,
    value: getGalleryCookieValue(galleryPassword),
  });

  return response;
}
