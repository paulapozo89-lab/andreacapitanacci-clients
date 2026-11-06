"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Zip, ZipPassThrough } from "fflate";
import type { Gallery as G, Photo, Section } from "@/lib/galleries";

/* ---------- Íconos ---------- */
const IconDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M5 19.5h14" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconArrow = ({ dir }: { dir: "l" | "r" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
    <path d={dir === "l" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
  </svg>
);

/* ---------- Utilidades ---------- */
const pad = (n: number) => String(n).padStart(2, "0");
const mb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1048576))} MB`;
const zipLabel = (title: string) => title.replace(/[—–]/g, "-").replace(/[^\w\- ]+/g, "").replace(/\s*-\s*/g, "-").replace(/\s+/g, "-");

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** ZIP sin compresión (las JPG ya vienen comprimidas): rápido y sin pérdida. */
async function buildZip(entries: { path: string; url: string }[], onStep: (done: number) => void): Promise<Blob> {
  const chunks: Uint8Array[] = [];
  let failure: unknown = null;
  const zip = new Zip((err, chunk) => {
    if (err) failure = err;
    else chunks.push(chunk);
  });
  for (let i = 0; i < entries.length; i++) {
    const res = await fetch(entries[i].url, { credentials: "same-origin" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = new Uint8Array(await res.arrayBuffer());
    const file = new ZipPassThrough(entries[i].path);
    zip.add(file);
    file.push(data, true);
    if (failure) throw failure;
    onStep(i + 1);
  }
  zip.end();
  if (failure) throw failure;
  return new Blob(chunks as BlobPart[], { type: "application/zip" });
}

/* ---------- Miniatura ---------- */
function Tile({ src, photo, alt, onOpen, download }: { src: string; photo: Photo; alt: string; onOpen: () => void; download: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth > 0) setLoaded(true);
  }, []);
  return (
    <figure className="tile" onClick={onOpen}>
      <img
        ref={ref}
        src={src}
        width={photo.w}
        height={photo.h}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        className={loaded ? "loaded" : undefined}
        onLoad={() => setLoaded(true)}
      />
      <a className="tile-dl" href={download} download onClick={(e) => e.stopPropagation()} aria-label={`Download ${alt}`} title="Download full resolution">
        <IconDown />
      </a>
    </figure>
  );
}

/* ---------- Galería ---------- */
export default function Gallery({ gallery }: { gallery: G }) {
  const { slug, sections } = gallery;
  const base = `/g/${slug}`;
  const total = sections.reduce((n, s) => n + s.photos.length, 0);
  const totalBytes = sections.reduce((n, s) => n + s.photos.reduce((m, p) => m + p.bytes, 0), 0);

  const [view, setView] = useState<{ s: number; i: number } | null>(null);
  const [active, setActive] = useState(sections[0]?.id);
  const [job, setJob] = useState<{ key: string; label: string; done: number; total: number } | null>(null);
  const [toast, setToast] = useState("");

  const full = useCallback((p: Photo) => `${base}/full/${p.name}.jpg`, [base]);

  /* Colección visible → resalta en el índice */
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (items) => items.forEach((it) => it.isIntersecting && setActive(it.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  async function downloadSet(key: string, label: string, list: { section: Section; photo: Photo }[], filename: string, folders: boolean) {
    if (job) return;
    setJob({ key, label, done: 0, total: list.length });
    try {
      const entries = list.map(({ section, photo }) => ({
        path: folders ? `${zipLabel(section.title)}/${photo.name}.jpg` : `${photo.name}.jpg`,
        url: full(photo),
      }));
      const blob = await buildZip(entries, (done) => setJob((j) => (j ? { ...j, done } : j)));
      saveBlob(blob, filename);
      setToast("Your download has started.");
    } catch {
      setToast("The download was interrupted. Please try again.");
    } finally {
      setJob(null);
      setTimeout(() => setToast(""), 4000);
    }
  }

  const all = useMemo(() => sections.flatMap((section) => section.photos.map((photo) => ({ section, photo }))), [sections]);

  return (
    <>
      <header className="header">
        <a href="https://andreacapitanacci.com" className="monogram" aria-label="Andrea Capitanacci">AC</a>
        <span className="caps brand">Andrea Capitanacci · Visual Storyteller</span>
      </header>

      <main>
        <section className="hero">
          <p className="caps muted">Private Gallery</p>
          <h1 className="display">{gallery.client}</h1>
          <div className="rule" />
          <div className="hero-row">
            <div>
              <div className="hero-meta caps">
                <span>{gallery.occasion}</span>
                <span>{gallery.date}</span>
                <span>{total} photographs</span>
              </div>
              <p className="hero-note">
                Tap any photograph to view it full screen. Download a single image, a collection, or the complete gallery in full resolution.
              </p>
            </div>
            <button
              className="btn"
              disabled={!!job}
              onClick={() => downloadSet("all", "Complete gallery", all, `${gallery.client.replace(/\s+/g, "-")}_Andrea-Capitanacci.zip`, true)}
            >
              <IconDown />
              {job?.key === "all" ? `Preparing ${job.done} / ${job.total}` : `Download all · ${mb(totalBytes)}`}
            </button>
          </div>
        </section>

        <nav className="index caps" aria-label="Collections">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className={active === s.id ? "on" : undefined}>
              {s.title}
              <sup>{s.photos.length}</sup>
            </a>
          ))}
        </nav>

        {sections.map((s, si) => {
          const bytes = s.photos.reduce((m, p) => m + p.bytes, 0);
          return (
            <section key={s.id} id={s.id} className="section">
              <div className="section-head">
                <div>
                  <p className="caps section-num">{pad(si + 1)}</p>
                  <h2 className="display">{s.title}</h2>
                  <div className="rule" />
                  <p className="caps section-count">{s.photos.length} photographs</p>
                </div>
                <button
                  className="btn ghost"
                  disabled={!!job}
                  onClick={() => downloadSet(s.id, s.title, s.photos.map((photo) => ({ section: s, photo })), `Izaguirre_${zipLabel(s.title)}.zip`, false)}
                >
                  <IconDown />
                  {job?.key === s.id ? `Preparing ${job.done} / ${job.total}` : `Download collection · ${mb(bytes)}`}
                </button>
              </div>
              <div className="grid">
                {s.photos.map((p, i) => (
                  <Tile
                    key={p.name}
                    src={`${base}/grid/${p.name}.webp`}
                    photo={p}
                    alt={`${s.title}, photograph ${i + 1}`}
                    download={full(p)}
                    onOpen={() => setView({ s: si, i })}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      <footer className="footer">
        <div>
          <div className="monogram">AC</div>
          <p className="serif muted" style={{ fontSize: 18, marginTop: 10 }}>Photography by Andrea Capitanacci</p>
        </div>
        <div className="footer-links caps">
          <a href="https://andreacapitanacci.com">andreacapitanacci.com</a>
          <a href="mailto:hola@andreacapitanacci.com">hola@andreacapitanacci.com</a>
          <a href="https://www.instagram.com/capitanacci_/">@capitanacci_</a>
        </div>
      </footer>

      {view && <Lightbox sections={sections} base={base} start={view} onClose={() => setView(null)} full={full} />}
      {job && <div className="toast">Preparing {job.label} · {job.done} of {job.total}</div>}
      {!job && toast && <div className="toast">{toast}</div>}
    </>
  );
}

/* ---------- Visor a pantalla completa ---------- */
function Lightbox({
  sections, base, start, onClose, full,
}: { sections: Section[]; base: string; start: { s: number; i: number }; onClose: () => void; full: (p: Photo) => string }) {
  const [pos, setPos] = useState(start);
  const section = sections[pos.s];
  const photo = section.photos[pos.i];
  const n = section.photos.length;
  const touch = useRef<number | null>(null);

  const go = useCallback((d: number) => setPos((p) => ({ s: p.s, i: (p.i + d + n) % n })), [n]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [go, onClose]);

  /* Precarga la foto anterior y la siguiente */
  useEffect(() => {
    [1, -1].forEach((d) => {
      const p = section.photos[(pos.i + d + n) % n];
      const img = new Image();
      img.src = `${base}/view/${p.name}.webp`;
    });
  }, [pos, section, base, n]);

  return (
    <div className="lb" role="dialog" aria-modal="true" aria-label={section.title}>
      <div className="lb-top">
        <span className="caps">{section.title} · {pos.i + 1} / {n}</span>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><IconClose /></button>
      </div>
      <div
        className="lb-stage"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        <img key={photo.name} src={`${base}/view/${photo.name}.webp`} width={photo.w} height={photo.h} alt={`${section.title}, photograph ${pos.i + 1}`} draggable={false} />
        {n > 1 && (
          <>
            <button className="lb-nav lb-prev" onClick={() => go(-1)} aria-label="Previous"><IconArrow dir="l" /></button>
            <button className="lb-nav lb-next" onClick={() => go(1)} aria-label="Next"><IconArrow dir="r" /></button>
          </>
        )}
      </div>
      <div className="lb-bottom">
        <span className="caps muted" style={{ fontSize: 11 }}>{photo.w} × {photo.h} px</span>
        <a className="btn" href={full(photo)} download><IconDown />Download</a>
      </div>
    </div>
  );
}
