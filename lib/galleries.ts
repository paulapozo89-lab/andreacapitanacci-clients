import izaguirre from "./izaguirre.json";

export type Photo = { name: string; w: number; h: number; bytes: number };
export type Section = { id: string; title: string; photos: Photo[] };
export type Gallery = {
  slug: string;
  client: string;
  occasion: string;
  date: string;
  /** Nombre de la variable de entorno que guarda la clave de esta galería. */
  passwordEnv: string;
  sections: Section[];
};

/**
 * Galerías de clientes. Para agregar una nueva:
 * 1. Fotos en public/g/<slug>/{grid,view,full}
 * 2. JSON de secciones en lib/<slug>.json
 * 3. Entrada aquí + variable de entorno GALLERY_PASSWORD_<SLUG> en Vercel
 */
export const GALLERIES: Record<string, Gallery> = {
  izaguirre: {
    slug: "izaguirre",
    client: "Izaguirre Law Firm",
    occasion: "Brand Photoshoot",
    date: "October 2026",
    passwordEnv: "GALLERY_PASSWORD_IZAGUIRRE",
    sections: izaguirre.sections,
  },
};

export function getGallery(slug: string): Gallery | null {
  return Object.prototype.hasOwnProperty.call(GALLERIES, slug) ? GALLERIES[slug] : null;
}
