import { NextResponse, type NextRequest } from "next/server";
import { cookieName, isAuthorized } from "@/lib/auth";

// Mapa slug → variable de la clave. Se duplica aquí para no cargar los JSON de fotos en el Edge.
const PASSWORD_ENV: Record<string, string> = {
  izaguirre: "GALLERY_PASSWORD_IZAGUIRRE",
};

/** Ningún archivo de /g/<slug>/ se entrega sin la cookie de acceso de esa galería. */
export async function middleware(req: NextRequest) {
  const slug = req.nextUrl.pathname.split("/")[2] ?? "";
  const env = PASSWORD_ENV[slug];
  const ok = env ? await isAuthorized(slug, env, req.cookies.get(cookieName(slug))?.value) : false;
  if (!ok) return new NextResponse("Not found", { status: 404 });
  return NextResponse.next();
}

export const config = {
  matcher: ["/g/:path*"],
};
