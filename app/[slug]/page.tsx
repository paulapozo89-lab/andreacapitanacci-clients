import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cookieName, isAuthorized } from "@/lib/auth";
import { getGallery } from "@/lib/galleries";
import Gate from "./Gate";
import Gallery from "./Gallery";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = getGallery((await params).slug);
  return { title: g ? `${g.client} · Private Gallery · Andrea Capitanacci` : "Andrea Capitanacci" };
}

export default async function GalleryPage({ params }: Props) {
  const { slug } = await params;
  const gallery = getGallery(slug);
  if (!gallery) notFound();

  const jar = await cookies();
  const authorized = await isAuthorized(slug, gallery.passwordEnv, jar.get(cookieName(slug))?.value);

  if (!authorized) return <Gate slug={slug} client={gallery.client} />;
  return <Gallery gallery={gallery} />;
}
