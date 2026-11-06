/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Ninguna galería debe aparecer en buscadores.
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noimageindex" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
      {
        // Fotos de clientes: solo caché del navegador, nunca en cachés compartidas.
        source: "/g/:path*",
        headers: [{ key: "Cache-Control", value: "private, max-age=86400" }],
      },
    ];
  },
};

export default nextConfig;
