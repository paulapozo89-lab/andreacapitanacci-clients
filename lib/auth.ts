// Funciona igual en el middleware (Edge) y en las rutas (Node): solo usa Web Crypto.

export const cookieName = (slug: string) => `acg_${slug}`;

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Token de acceso = HMAC(secreto, slug:clave).
 * Si se cambia la clave o el secreto en Vercel, todos los accesos anteriores dejan de valer.
 */
export async function accessToken(slug: string, password: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(`${slug}:${password}`)));
}

/** Comparación en tiempo constante para no filtrar información por tiempos de respuesta. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isAuthorized(slug: string, passwordEnv: string, cookieValue: string | undefined): Promise<boolean> {
  const secret = process.env.GALLERY_SECRET;
  const password = process.env[passwordEnv];
  if (!secret || !password || !cookieValue) return false;
  return safeEqual(cookieValue, await accessToken(slug, password, secret));
}
