import { NextResponse } from "next/server";
import { GALLERY_COOKIE_NAME } from "@/lib/gallery-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const redirectUrl = new URL("/", request.url);
  const response = NextResponse.redirect(redirectUrl, 303);

  response.cookies.set({
    httpOnly: true,
    maxAge: 0,
    name: GALLERY_COOKIE_NAME,
    path: "/",
    sameSite: "lax",
    secure: true,
    value: "",
  });

  return response;
}
