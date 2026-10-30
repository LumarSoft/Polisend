# Polisend — landing y panel

**Polisend** es el bot de WhatsApp con IA + panel para productores de seguros. Este repo tiene las dos caras:

- **Landing** en `/` (más `/privacidad` y `/terminos`): Next.js 16 con Cache Components, GSAP (ScrollTrigger +
  SplitText) y Lenis.
- **Panel** en `/admin`, el que usan todas las organizaciones (Owner = Lumarsoft, SuperAdmin = una organización,
  Admin = un productor o sucursal): TanStack Query, shadcn/ui y Tailwind CSS 4. Habla con la API multi-tenant
  (`api_john`). Llegó el 2026-10-30 desde el repo `polisend-panel`, que a su vez salió del panel de `front_John`
  (la historia anterior queda en esos repos).

Cada parte tiene su propio layout raíz (`src/app/(site)/layout.tsx` y `src/app/admin/layout.tsx`), con sus fuentes y
su hoja de estilos: pasar de la landing al panel es una carga de página completa y ningún estilo se mezcla.

## Desarrollo

```bash
pnpm install
pnpm dev
```

```bash
pnpm build && pnpm start
```

## Variables de entorno

Copiá `.env.example` a `.env.local`:

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Número de ventas al que llevan todos los botones "Quiero Polisend" (formato internacional, solo dígitos). Si falta, usa la línea de ventas `5493412776893` (341 277-6893). |
| `NEXT_PUBLIC_SITE_URL` | Opcional. Dominio público del sitio, sin barra final (canonical, sitemap, robots, vista previa al compartir, datos estructurados y `llms.txt`). Si está vacío, en Vercel se usa el dominio de producción del proyecto (hoy `polisend.vercel.app`, o el dominio propio cuando se conecte). |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Opcional. Token de verificación de Google Search Console (meta tag). |
| `NEXT_PUBLIC_API_URL` | URL de la API, sin barra final. La usa el panel para todo y la landing para los precios (catálogo del Owner, `GET /public/plans`, cache de 1 hora; sin respuesta: el catálogo inicial de `src/lib/plans.ts`). En los builds de Vercel sale de `.env.production` (la API de producción); en local, de `.env.local`. |
| `NEXT_PUBLIC_LEGAL_EMAIL` | Correo de contacto de las páginas de privacidad y términos. Vacío: solo el WhatsApp de ventas. |

Los planes y precios vienen de la API (`src/lib/plans.ts`, con el catálogo inicial como respaldo); el número de ventas y las compañías integradas, de `src/lib/site.ts`. Las páginas `/privacidad` y `/terminos` toman su texto de `src/lib/legal/`.

## Estructura

```
src/
├── app/
│   ├── (site)/             landing: layout raíz, página, privacidad, términos, imagen de Open Graph, globals.css
│   ├── admin/              panel: layout raíz, login, (panel)/<sección>, fuentes, panel.css
│   └── …                   ícono, robots, sitemap, manifest y llms.txt (compartidos)
├── components/
│   ├── brand/logo.tsx      isotipo (burbuja + "P" + escudo) y logotipo de la landing
│   ├── brand-mark.tsx      isotipo del panel
│   ├── chat/               teléfono con chat animado; los guiones viven en scripts.ts
│   ├── sections/           una sección de la landing por archivo, en el orden de page.tsx
│   ├── providers/          scroll suave (Lenis sincronizado con GSAP)
│   └── ui/                 primitives.tsx (landing) y los componentes de shadcn (panel)
├── features/admin/         pantallas, hooks, contextos y helpers del panel
├── hooks/                  hooks compartidos del panel
├── services/               llamadas a la API, una por dominio (panel)
├── types/api/              tipos de pedidos y respuestas de la API (panel)
└── lib/                    config del sitio, planes, GSAP y hooks (landing); api-client, query-keys y utils (panel)
```

Cada hoja de estilos escanea solo los archivos de su parte (`@source` al principio de `globals.css` y `panel.css`):
si se agrega una carpeta nueva con clases de Tailwind, hay que sumarla ahí. Las convenciones del panel están en
[`docs/panel/`](docs/panel/).

## SEO y GEO

Rutas generadas: `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, `/llms.txt` (resumen en Markdown para asistentes de IA), `/opengraph-image` y `/apple-icon`. Los datos estructurados (JSON-LD: Organization, WebSite, SoftwareApplication con precio y FAQPage) están en `src/components/seo/json-ld.tsx`; las funciones del producto que usan JSON-LD y `llms.txt` están en `src/lib/product.ts`. Auditoría y plan de acción: [`docs/seo-geo.md`](docs/seo-geo.md).

## Contenido

Todas las funciones que muestra la landing existen en el producto (bot, API y panel). Los nombres, patentes,
montos y horarios de los ejemplos son ficticios. Las animaciones respetan `prefers-reduced-motion`.
