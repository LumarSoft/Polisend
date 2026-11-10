@AGENTS.md

# Polisend — landing y panel

Este repo tiene la landing pública de Polisend (`/`, `/privacidad`, `/terminos`) y el panel que usan todas las
organizaciones (`/admin`). Habla con la API multi-tenant `api_john` (NestJS + Prisma + MySQL); el bot de WhatsApp es
`BOT_JPMG`; la web y el portal de asegurados de JPMG siguen en `front_John`. El plan y su estado están en
`docs/PLAN-SAAS.md`, en la carpeta `john/` de arriba. Estructura y variables: `README.md`.

Ningún nombre de cliente en el código: un pedido termina en una función para todos, una configuración por organización o
un desarrollo a medida fuera del producto.

## El panel vive en dos repos: se editan los dos

Hasta que se apague el panel de JPMG (`front_John`, también en `/admin`), **todo cambio del panel se hace acá y en
`front_John`, en la misma tarea**, para que queden lo más nivelados posible: mismas pantallas, mismos endpoints, mismo
comportamiento. Un cambio que entra en uno solo queda a medias.

- Portar de un repo al otro: el alias de imports es `@/` acá y `@/src/` en `front_John`; el resto del código del panel
  se copia igual.
- Lo que puede diferir, y solo eso: la marca (acá Polisend, allá JPMG) y los textos que nombran a quién pedirle ayuda o
  quién define los planes (acá "Polisend", allá "Lumarsoft"). Si un cambio no tiene sentido en uno de los dos, decirlo en
  vez de omitirlo en silencio.
- Antes de cerrar una tarea del panel, revisar el desnivel desde la carpeta `JohnPellegrini`. Solo puede listar
  `app-sidebar.tsx`, `facturacion-view.tsx`, `login-form.tsx`, `org-mark.tsx`, `triunfo-status-banner.tsx`,
  `use-panel-brand.ts`, `org-brand.ts`, `panel-theme.ts` (marca y textos), `query-keys.ts` y `siniestros.service.ts`
  (`front_John` también tiene las claves y llamadas de su web pública); cualquier otro es un cambio que falta portar:

  ```bash
  cd polisend/src && for f in $(git ls-files features/admin services types lib/api-client.ts lib/query-keys.ts hooks); do diff -q <(sed "s#'@/src/#'@/#g" ../../front_John/src/$f 2>/dev/null) $f >/dev/null || echo "$f"; done
  ```
- Formato: este repo no tiene configuración de Prettier y el de `front_John` sí. Un archivo del panel que existe en los
  dos se porta copiándolo ya formateado desde `front_John` con el `sed` de los imports, y acá no se le vuelve a pasar
  Prettier: con los imports `@/`, más cortos, y otra versión de Prettier (`npx` baja la última) reacomoda líneas y el
  chequeo de arriba deja de dar igual. Solo un archivo que existe nada más acá se formatea, con el Prettier de
  `front_John`: `../front_John/node_modules/.bin/prettier --single-quote --no-semi --print-width 120 --arrow-parens avoid`
  (un `prettier --write` pelado los pasa a comillas dobles y punto y coma).

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
