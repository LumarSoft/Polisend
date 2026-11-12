@AGENTS.md

# Polisend — landing y panel

Este repo tiene la landing pública de Polisend (`/`, `/privacidad`, `/terminos`) y el panel que usan todas las
organizaciones (`/admin`). Habla con la API multi-tenant `api_john` (NestJS + Prisma + MySQL); el bot de WhatsApp es
`BOT_JPMG`; la web pública y el portal de asegurados de JPMG siguen en `front_John` (su `/admin` ya no se mantiene). El plan y su estado están en
`docs/PLAN-SAAS.md`, en la carpeta `john/` de arriba. Estructura y variables: `README.md`.

Ningún nombre de cliente en el código: un pedido termina en una función para todos, una configuración por organización o
un desarrollo a medida fuera del producto.

## El panel es solo este repo

Desde el 11/11/2026 el panel que usan todas las organizaciones es este (`/admin`) y es el único que se mantiene. El
`/admin` de `front_John` quedó congelado hasta que se apague el panel de JPMG: **un cambio del panel se hace acá y
nada más**, no se porta a `front_John` ni se revisa el desnivel entre los dos repos. `front_John` sigue solo para su
web pública y el portal de asegurados.

- Formato del panel: este repo no tiene configuración de Prettier. El código de `src/app/admin` y `src/features/admin`
  va con comillas simples y sin punto y coma; para formatear un archivo del panel usar
  `pnpm dlx prettier@3 --write --single-quote --no-semi --print-width 120 --arrow-parens avoid <archivo>`
  (un `prettier --write` pelado lo pasa a comillas dobles y punto y coma).

## Comandos

```bash
pnpm dev                 # http://localhost:3000 (landing) y /admin (panel)
pnpm build && pnpm start
pnpm lint
pnpm exec tsc --noEmit
```

## Dos layouts raíz

- `src/app/(site)/layout.tsx`: landing, Cache Components (`'use cache'` en `src/lib/plans.ts`), `globals.css`.
  Código con comillas dobles y punto y coma.
- `src/app/admin/layout.tsx`: panel, `export const instant = false` (lee la URL y la sesión en el navegador, se
  renderiza en cada pedido), `panel.css`. Código con comillas simples y sin punto y coma, como venía del panel.
- Cada hoja de estilos solo escanea su parte (`@source`). Carpeta nueva con clases de Tailwind = sumarla ahí.

## Panel

- Marca: el isotipo de Polisend (`src/components/brand-mark.tsx`) antes del login y para el OWNER; después del login,
  la organización del usuario (`usePanelBrand()` en `src/features/admin/lib/org-brand.ts`, desde
  `AdminUser.organization` de `/users/me`), con su logo si lo cargó.
- `src/services/` hace todas las llamadas a la API; los componentes nunca hacen fetch. TanStack Query para el estado
  del servidor, claves en `src/lib/query-keys.ts`. Sin `any`.
- Temas: cada usuario elige claro/oscuro/automático y una paleta (`src/features/admin/lib/panel-theme.ts`). Acento =
  tokens `ember`; neutros = `ink*`, `faint*`, `paper*`, `canvas*`, `line*` o los de shadcn; sin hex ni
  `bg-white`/`text-black`; los colores de estado llevan su variante `dark:`; Whatsapp usa las variables `--wa-*`.
- Convenciones completas: `docs/panel/`.
