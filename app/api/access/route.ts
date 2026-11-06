import { NextResponse } from "next/server";
import { accessToken, cookieName, safeEqual } from "@/lib/auth";
import { getGallery } from "@/lib/galleries";

export const runtime = "nodejs";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  let body: { slug?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const slug = typeof body.slug === "string" ? body.slug : "";
  const typed = typeof body.password === "string" ? body.password.trim() : "";
  const gallery = getGallery(slug);
  const password = gallery ? process.env[gallery.passwordEnv] : undefined;
  const secret = process.env.GALLERY_SECRET || password;

  // La clave no distingue mayúsculas para que el cliente no se atore al teclearla.
  if (!gallery || !secret || !password || !typed || !safeEqual(typed.toUpperCase(), password.toUpperCase())) {
    await sleep(800); // frena intentos repetidos
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName(slug), await accessToken(slug, password, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
