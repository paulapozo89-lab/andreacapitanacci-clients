import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const italiana = localFont({ src: "./fonts/italiana-latin-400-normal.woff2", variable: "--font-display", display: "swap" });
const instrument = localFont({
  src: [
    { path: "./fonts/instrument-sans-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/instrument-sans-latin-500-normal.woff2", weight: "500" },
  ],
  variable: "--font-sans",
  display: "swap",
});
const crimson = localFont({ src: "./fonts/crimson-pro-latin-400-italic.woff2", style: "italic", variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://clients.andreacapitanacci.com"),
  title: "Private Gallery · Andrea Capitanacci",
  description: "Private client gallery by Andrea Capitanacci, Visual Storyteller.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Private Gallery · Andrea Capitanacci",
    description: "Your photographs are ready.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
};

export const viewport: Viewport = { themeColor: "#2A2A2D" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${italiana.variable} ${instrument.variable} ${crimson.variable}`}>
      <body>{children}</body>
    </html>
  );
}
