# Andrea Capitanacci · Client Galleries

Galerías privadas para entregar fotos a clientes. Se publica en `clients.andreacapitanacci.com/<cliente>`.
Proyecto independiente del sitio principal (`andreacapitanacci`): cambios aquí no afectan andreacapitanacci.com.

## Cómo funciona el acceso
- Cada galería pide una clave. La clave vive en Vercel como variable de entorno `GALLERY_PASSWORD_<CLIENTE>`.
- Al entrar, se guarda una cookie firmada por 30 días. Sin esa cookie, ninguna foto de `/g/<cliente>/` se entrega (responde 404), aunque se tenga el link directo.
- Si se cambia la clave en Vercel (y se vuelve a desplegar), todos los accesos anteriores se invalidan.
- Opcional: `GALLERY_SECRET` agrega una llave extra para firmar las cookies.
- Las galerías no se indexan en buscadores.

## Agregar un cliente nuevo
1. Fotos en `public/g/<slug>/full` (originales JPG), `grid` (WebP ~900 px) y `view` (WebP ~2200 px).
2. Secciones en `lib/<slug>.json` (mismo formato que `lib/izaguirre.json`).
3. Entrada en `lib/galleries.ts` y en el mapa `PASSWORD_ENV` de `middleware.ts`.
4. Variable `GALLERY_PASSWORD_<SLUG>` en Vercel → Settings → Environment Variables.

## Galerías activas
| Cliente | URL | Fotos | Entregada |
|---|---|---|---|
| Izaguirre Law Firm | /izaguirre | 48 | Nov 2026 |
