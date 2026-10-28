# Polisend — landing

Landing de **Polisend**, el bot de WhatsApp con IA + panel para productores de seguros.

Stack: Next.js 16 (App Router, página estática) · React 19 · Tailwind CSS 4 · GSAP (ScrollTrigger + SplitText) · Lenis.

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
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio (para metadatos y la imagen de Open Graph). |

El precio (USD 60/mes por cada 1.000 mensajes), el número de ventas y las compañías integradas están en `src/lib/site.ts`.

## Estructura

```
src/
├── app/                    layout, página, ícono e imagen de Open Graph
├── components/
│   ├── brand/logo.tsx      isotipo (burbuja + "P" + escudo) y logotipo
│   ├── chat/               teléfono con chat animado; los guiones viven en scripts.ts
│   ├── sections/           una sección de la landing por archivo, en el orden de page.tsx
│   ├── providers/          scroll suave (Lenis sincronizado con GSAP)
│   └── ui/primitives.tsx   botón CTA a WhatsApp, títulos con revelado, revelados al hacer scroll
└── lib/                    config del sitio, GSAP, hooks
```

## Contenido

Todas las funciones que muestra la landing existen en el producto (bot, API y panel). Los nombres, patentes,
montos y horarios de los ejemplos son ficticios. Las animaciones respetan `prefers-reduced-motion`.
