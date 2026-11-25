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

- Marca: el isotipo de Polisend (`src/components/brand-mark.tsx`) antes del login, para el Developer y para un Owner
  sin principal elegido; después del login, la organización del usuario o el principal activo de un Owner
  (`usePanelBrand()` en `src/features/admin/lib/org-brand.ts`, desde `AdminUser.organization` de `/users/me`), con su
  logo si lo cargó.
- `src/services/` hace todas las llamadas a la API; los componentes nunca hacen fetch. TanStack Query para el estado
  del servidor, claves en `src/lib/query-keys.ts`. Sin `any`.
- Temas: cada usuario elige claro/oscuro/automático y una paleta (`src/features/admin/lib/panel-theme.ts`). Acento =
  tokens `ember`; neutros = `ink*`, `faint*`, `paper*`, `canvas*`, `line*` o los de shadcn; sin hex ni
  `bg-white`/`text-black`; los colores de estado llevan su variante `dark:`; Whatsapp usa las variables `--wa-*`.
- El asistente tiene identidad propia, igual en todas las paletas: tokens `iris*` (`iris`, `iris-2`, `iris-3`,
  `iris-ink` para texto, `iris-soft`, `iris-ring`, `iris-glow`, `on-iris`), su marca "Compañero"
  (`components/assistant-mark.tsx`, con estados `idle`/`thinking`/`writing`/`happy`/`worried`) y el botón para
  preguntarle desde una pantalla (`AskAssistantButton` en `assistant-launcher.tsx`, variantes `chip`, `icon`, `link`).
  Nada del chat usa `ember`.
- Novedades con aviso y paso a paso (24/11): una mejora de Mejoras puede tener `screen` (id de `SCREENS`) y `steps`
  (hasta 6). Se anuncia una vez por usuario en esa pantalla (`ImprovementAnnouncement`, los primeros 30 días) y su
  paso a paso se repite desde Mejoras (`ImprovementGuidesShelf`); lo corre el mismo `TourOverlay` del asistente
  (`tourStore.play`). Lumar lo escribe en el formulario de la mejora. **Toda función nueva lleva `data-help="…"` en
  sus elementos principales**, así su paso a paso los puede marcar. Detalle en `lib/improvement-guides.ts`.
- Convenciones completas: `docs/panel/`.

## Roles, red y principal activo (plan `docs/PLAN-OWNER-ZONAS.md` §6)

- Cuatro roles: DEVELOPER (Lumar: solo pantallas de plataforma, ve plata, nunca una cartera), OWNER (dueño de una red:
  "Mi red" + el menú de SuperAdmin del principal activo, nunca un importe), SUPERADMIN y ADMIN. Ningún literal de rol
  fuera de `src/features/admin/lib/roles.ts` y `src/types/api/` (lo frena una regla de ESLint): usar `useRole()`
  (`isDeveloper`, `isOwner`, `isSuperAdmin`, `isAdmin`, `canManageOrg`, `seesMoney`) o `ROLES`.
- Soporte (19/11): el Owner entra al panel de un SuperAdmin o Admin desde Usuarios («Entrar a dar soporte»):
  `useSupport()` (`context/support-context.tsx`) manda `X-Support-User` en vez de `X-Acting-Principal` y el panel es
  el de esa persona, con `SupportBanner` arriba. Detalle en `docs/panel/owner-zones.md`.
- Principal activo del Owner: `useActingPrincipal()` (`context/acting-principal-context.tsx`). El cliente HTTP
  (`src/lib/api-client.ts`) manda `X-Acting-Principal` en cada request del Owner y descarta la respuesta de otro
  principal. Cambiar de principal remonta el contenido con un `QueryClient` nuevo (`src/app/admin/providers.tsx`);
  cambiar de productor es solo un filtro.
- Pantalla de trabajo nueva: `SectionScopeFilter` + `useScopeFilterState()` arriba, los datos dentro de
  `<RequirePrincipal>`, las consultas con `enabled: useTenantQueriesEnabled()`, y sumar la ruta a
  `SCREENS_WITH_NETWORK_FILTER` (`lib/panel-areas.ts`). Listas de toda la red: `<NetworkFilter mode="network">`.
- Rutas: `/admin/red`, `/admin/red/consumo` (Owner), `/admin/owners` (Developer), `/admin/cuenta` ("Mi cuenta", todos
  los roles; es la única de Configuración que tiene el Developer), `/admin/activar` y `/admin/recuperar` (públicas,
  fuera de `(panel)`).
- Tokens (17/11): fuera del Developer, planes y consumo se dicen en tokens (1 mensaje = 1 token, uno de campaña = 2;
  `lib/tokens.ts`, `<TokensHint>`) y nunca aparece un precio ni un USD de la plataforma. Detalle en
  `docs/panel/owner-zones.md` (sección «Tokens, password recovery and consumption per Admin»).
- Pantallas de plataforma contra `/platform/*` (la API mantiene `/owner/*` como alias); la red, contra `/hierarchy/*`.

## Ingreso, verificación en dos pasos y enlaces de contraseña (plan §6.6)

- Login en dos pasos: `useLoginSubmit()` (`hooks/use-login.ts`) devuelve `step` (`password` | `two-factor`) y
  `submitCode`; la segunda pantalla es `login-two-factor-step.tsx` (código de la app o de recuperación). Un código
  incorrecto deja reintentar; un desafío vencido o quemado (5 códigos mal) vuelve a la contraseña con el mensaje de la API.
- Mi cuenta (`MyAccountSection`): tarjeta «Verificación en dos pasos» (`two-factor-card.tsx`): QR local con
  `qrcode.react`, clave manual, confirmación y los 10 códigos de recuperación una sola vez (copiar y descargar). Solo se
  muestra si `/users/me` trae `twoFactorEnabled`. Cambiar la propia contraseña cierra la sesión a propósito
  (`useUpdateProfile`), deja el correo para el login y lo explica; otra sesión cerrada por un cambio de contraseña ve
  «Tu sesión terminó».
- `/admin/activar` (pública): lee el token en el navegador (`lib/link-token.ts`), lo saca de la URL, cierra la
  sesión que había al abrir la página (una sola vez: un login posterior en otra pestaña queda) y nunca inicia sesión
  sola. Todo texto de la API va como texto plano.
- Usuarios y Owners: `<AccountAccessDialog scope="network" | "owner" action="password-setup" | "reset-two-factor">`
  y la insignia `<TwoFactorBadge>` (`account-access-dialog.tsx`), con `useAccountAccess` por debajo.
