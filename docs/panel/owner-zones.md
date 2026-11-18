# Developer, Owner and zones

How the panel splits the platform from the carteras. The plan is `docs/PLAN-OWNER-ZONAS.md` (§6) in the `john/`
folder above; the API contract is `docs/handoff/owner-zones-step3/contract-final.md` and its addendum.

## Roles

| Role | Who | Panel |
|---|---|---|
| `DEVELOPER` | Lumar, the platform | Platform screens only. Sees money. Never enters a cartera. |
| `OWNER` | Owner of a network of zones | "Mi red", "Usuarios" and Administración (Facturación, Configuración) of the whole network, then a trimmed SuperAdmin menu of the acting principal (Inicio, Tareas, Asegurados, Cobranzas, Balance mensual, Ayuda). Never sees an amount. |
| `SUPERADMIN` | Runs one principal | As before. "Usuarios" adds a "Productores" tab. |
| `ADMIN` | Works some codes of one principal | Unchanged. |

- No role literal outside `lib/roles.ts` and `src/types/api/`. An ESLint rule enforces it. Use `useRole()`
  (`isDeveloper`, `isOwner`, `isSuperAdmin`, `isAdmin`, `canManageOrg`, `seesMoney`) or `ROLES`.
- Labels: `Lumarsoft · Developer`, `Owner`, `SuperAdmin`, `Admin` (`roleLabel`).
- Money (`USD`, price, cost, margin, profit, budget) renders only when `seesMoney` is true, that is, for the
  Developer. The Owner, SuperAdmin and Admin see plans and consumption in tokens (see «Tokens» below).

## Acting principal (Owner)

- `useActingPrincipal()` (`context/acting-principal-context.tsx`) holds the principal an Owner works in.
- The choice is kept per user and per browser tab. `sessionStorage` holds `panel.acting.<userId>`; `localStorage`
  holds the last one (`panel.acting.last.<userId>`) as the starting value. Logging out clears both.
- `lib/api-client.ts` sends it as `X-Acting-Principal` on every request of an Owner (`apiRequest`, `apiStream`,
  `apiDownload`). The id is captured when the request is created. A response for another principal is dropped.
- Changing the principal remounts the panel content under a new `QueryClient` (`app/admin/providers.tsx`). Filters,
  open sheets, the assistant and drafts start over, on the same tab and without URL params. Changing the productor
  is only a filter.
- `ACTING_PRINCIPAL_INVALID` (or `actingInvalid` on `/users/me`) clears the choice, goes back to the own principal
  and shows «Ya no tenés acceso a ese principal».
- A dropped response (no echo, or another principal's) asks for `/users/me` again: an Owner the Developer took back
  to SuperAdmin gets answers without the echo, and only its profile ends the Owner session (the content remounts on
  its own principal, «Tu cuenta ya no es Owner»).
- A write created after slow work in the browser (reading an Excel) passes `startedIn: actingPrincipalFor(token)`,
  taken when the person acted: if the Owner switched principal meanwhile, `apiRequest` does not send it
  (`ACTING_PRINCIPAL_CHANGED`).

## Cascading filter

- Zona › Principal › Productor in every Owner work tab, in the place of `ScopeFilter`. Productor shows only where
  the data is per code. SuperAdmin and Admin keep `ScopeFilter`.
- A new work screen needs: `SectionScopeFilter` + `useScopeFilterState()` on top, its data inside
  `<RequirePrincipal>`, its queries with `enabled: useTenantQueriesEnabled()`, and its route in
  `SCREENS_WITH_NETWORK_FILTER` (`lib/panel-areas.ts`).
- A zone that does not hold the acting principal leaves Principal empty. The screen then shows «Elegí un principal
  de la zona …» and no data: work screens never mix principals.
- Network-wide lists (Mi red, Usuarios, Consumo de la red) use `<NetworkFilter mode="network">`: there the three
  levels are plain list filters.

## Routes

| Route | Who | What |
|---|---|---|
| `/admin/red` | Owner | Mi red: zones, principals, productores and their Admins. «Sin SuperAdmin · crear uno», «Entrar», «Ver usuarios». |
| `/admin/red/consumo` | Owner | Consumo de la red: plan, plan tokens, sent and campaign messages, and «Cambiar» on each number's plan in the running month. No amount. Productor = the numbers billed to that code. |
| `/admin/usuarios` | Developer, Owner, SuperAdmin | One screen and one form for SuperAdmins and Admins. `?principal=<id>` preselects one. |
| `/admin/owners` | Developer | Owners y zonas: Owners with their zones and «2 pasos» badge; zones, plus a «Sin zona» row. |
| `/admin/cuenta` | Every role | Mi cuenta, with «Verificación en dos pasos». The only Configuración screen of the Developer. |
| `/admin/activar` | Public | Choose a password from a mailed link. Outside `(panel)`. |
| `/admin/recuperar` | Public | «¿Olvidaste tu contraseña?»: a 6-digit code by e-mail, then a new password. Outside `(panel)`. |

- `DEVELOPER_PATHS` (`lib/panel-areas.ts`) is the Developer's whole panel. Any other path, a pasted cartera URL
  included, goes back to Organizaciones, and no tenant request fires.

## What changed for each role

- **Developer.**
  - Organizaciones gets a Zona column and selector. Its detail links to Usuarios instead of listing users.
  - "Nueva organización" uses the new-principal form, with an optional first account by invitation.
  - Facturación → Tablero groups Owner › Zona › Principal › Número, plus "Sin zona" (see «Tokens» below).
  - New screens: Owners y zonas, and Usuarios for every principal.
- **Owner.**
  - Home is Mi red.
  - Above the menu of the acting principal, a "Mi red" group: Mi red, Usuarios and Administración (Facturación,
    Configuración).

## The Owner's trimmed panel (18/11/2026)

- The Owner does not use an office's day: `OWNER_HIDDEN_PATHS` (`lib/panel-areas.ts`) leaves Asuntos pendientes,
  Whatsapp, Campañas, Solicitudes, Siniestros, Rechazos and Números out of its menu, the shell sends a pasted URL of
  them to Inicio, and the sidebar does not load their pending counts.
- Facturación (`/admin/facturacion`) renders `NetworkUsageView variant="billing"`: the network's tokens with
  Todas/Todos at every level of `<NetworkFilter mode="network">`. `/admin/red/consumo` still answers, out of the menu.
- Configuración is global (`OwnerSettingsView`, no filter, no principal): Cuenta (with the codes preference), Logo
  (its own principal's, sent with `forPrincipal` = home) and Triunfo (only the web-service user). Assistant, hours,
  prices, coverages and each principal's Triunfo access stay with the SuperAdmins.
- Inactive codes and the ones Triunfo blocks (`triunfoBlocked` from `/hierarchy/tree` and `/hierarchy/principals`)
  are hidden in Mi red, Usuarios › Productores and the filters unless «Mostrar códigos inactivos y bloqueados» is on
  (Configuración › Cuenta, Owner and SuperAdmin; `hooks/use-hidden-codes.ts`, per browser).
  - The sidebar header shows the active zone and principal.
  - Tareas opens on "Todo el equipo"; the Owner is never an assignee.
  - The "nuevo" marks of Novedades and Mejoras are hidden.
- **SuperAdmin.**
  - Usuarios has no branch question: the principal is its own.
  - A "Productores" tab holds the principal's codes. It is the same `PrincipalCodesBlock` that Mi red uses.
  - "Alta guiada de productor" replaces the old branch flow of "Nuevo usuario".
  - It never sees an Owner or the Developer.
- **Admin.** Nothing, apart from the vocabulary of plan §6.5.
- **Everyone.**
  - Optional two-step verification: login second step, Mi cuenta card, «2 pasos» badge and reset in Usuarios and
    Owners y zonas.
  - Password-setup links (`/admin/activar`).

## The Developer and accounts (decision of 17/11)

The Developer manages users without seeing data. In any principal it may:

- create SuperAdmins and Admins, always by invitation. There is no password field: «Polisend nunca elige ni ve
  contraseñas; la persona la elige con el enlace»;
- change an account's name, role, codes and principal. Moving an account drops its codes; an Admin picks new ones;
- delete an account, the last one of a principal included;
- restore a deleted account (the 409 `EMAIL_RESTORABLE` of "Nuevo usuario"). It sends no password: the API mails a
  link;
- send the password-setup link and reset two-step verification.

Two limits stay, because with either the platform could log in as the person:

- the Developer never chooses or changes a password;
- the Developer never changes the e-mail of an existing account. The field is read-only, with the reason.

Its session still gets 403 on every data route. Each of these acts mails the principal's SuperAdmins and Owners
(«El equipo de Polisend modificó una cuenta de …»); the dialogs say so.

A restore (any role) lands only in the principal the form shows, or changes nothing. The API brings an account back
in the principal it was deleted from and the 409 does not name it, so its code check decides: an Admin goes back with
the codes chosen; a SuperAdmin restored by an Owner or the Developer goes back as an Admin with one code of the
form's principal and is then promoted (two notices for the Developer: restored, role changed). A miss says «Ese
usuario eliminado era de otro principal».

Any `PLATFORM_*` refusal the API still returns is shown with the API's Spanish message (`apiErrorMessage`).
Owner and SuperAdmin keep their rules: they may type a password (empty = invitation), edit the e-mail, and never
move an account to another principal.

## Tokens, password recovery and consumption per Admin (decisions of 17/11)

Plan: `docs/PLAN-TOKENS-Y-RECUPERACION.md` in the `john/` folder above (§1 decisions, §2 API contract, §3 panel).

### Tokens

- Every role but the Developer sees plans and consumption in **tokens**: 1 message = 1 token, a campaign message = 2.
  The API keeps its JSON names (`messages`, `includedMessages`, `messagesUsed`, `consumedMessages`, `planMessages`):
  they already hold tokens. Wording helpers: `lib/tokens.ts` (`tokens(n)`, `TOKENS_HINT`) and `<TokensHint>`
  (`billing-ui.tsx`), shown next to every consumption view (Facturación › Consumo and Por administrador, Números,
  Consumo de la red).
- Facturación › Consumo, Números, the sidebar bar, the limit notice (`plan-limit-actions.tsx`), Consumo de la red, Mi
  red and the assistant's suggestions say tokens. No `USD`, price or `$` of the platform outside the Developer
  (insurance prices in ARS and campaign premiums are the office's own, not platform money).
- The landing shows the plans in tokens without a price and a «Consultanos» button (`src/lib/plans.ts` reads
  `GET /public/plans` → `{ plans: [{ name, tokens, isTrial? }], blockTokens? }`, and falls back to `messages` /
  `blockMessages` of an older API; a price is never read). The structured data has no offers.

### Developer's Facturación

- Tablero: cards Facturado, Costo Lumarsoft, Margen de ganancia, Margen Lumarsoft and Margen Nico; the table, grouped
  Owner › Zona › Organización › Número, has exactly Tokens usados, Tokens del plan, Costo Lumarsoft, Margen de
  ganancia, Margen Lumarsoft and Margen Nico (`settledTokens`, `planTokens`, `costUsd`, `marginUsd`,
  `lumarsoftMarginUsd`, `nicoMarginUsd`; a null amount renders «—»). An Owner's row sums its zones with the API's rule
  (`sumBillingTotals`, `lib/platform-billing-groups.ts`): an amount is null as soon as one part is null, and an empty
  group sums to 0. The real Meta and OpenAI cost is shown nowhere, the organization's detail included.
- Liquidación: Costo Lumarsoft (per token), Margen de ganancia, Margen Lumarsoft, Margen Nico and Total Lumarsoft
  (the API's settlement fields keep their names). Planes: «Tokens» and «Por token».

### Plan per number

- `PlanSelect` (`billing-number-parts.tsx`) changes the plan of the running month with
  `PATCH /admin/billing/numbers/:id/plan`. SuperAdmin and Owner (`canManageOrg`): Facturación › Consumo, Por
  administrador and, for the Owner, «Cambiar» in each number of Consumo de la red.
- In Consumo de la red the number may belong to a principal other than the acting one. The popover reads that
  principal's `/admin/billing` and sends the change with `forPrincipal` (`lib/api-client.ts`): X-Acting-Principal
  carries the number's principal **for that request only**, the answer must echo it like any other, and the panel
  stays on its acting principal (no remount). `forPrincipal` is ignored outside an Owner's session.
- «Cambiar» shows only when the answer on screen is for the chosen month, the API has not closed it and it is
  Argentina's running month (`thisMonth()` in `billing-ui.tsx`, the API's `currentPeriod()`; never the browser's local
  clock). The popover checks again that `/admin/billing` (the API's running month) answers that same month.

### Por administrador (SuperAdmin, and an Owner inside a principal)

- Facturación › Por administrador reads `GET /admin/billing/by-admin?period=` → `{ period, admins: [{ userId, name,
  email, codes: [{ id, code, name }], numbers }], unassigned }` (numbers in the shape of `/admin/billing`). One
  collapsible block per Admin with its codes, tokens used against the plans' and each number with its bar and, in the
  running month, `PlanSelect`; then «Sin administrador». The catalog comes from `/admin/billing`.

### Password recovery

- `/admin/login` links «¿Olvidaste tu contraseña?» to `/admin/recuperar` (public, outside `(panel)`, like
  `/admin/activar`; no session is read or ended). Step 1: the e-mail → `POST /auth/password-reset/request`, always
  the neutral «Si el correo tiene una cuenta, te mandamos un código». Step 2: the 6 digits, the new password twice
  (the activation's rules) → `POST /auth/password-reset/confirm`; `PASSWORD_RESET_INVALID` says the code is wrong or
  expired; a 429 on either step (too many requests or confirms from one connection) asks calmly to wait a few minutes.
  «Reenviar código» unlocks after 60 s. Success leaves the e-mail for the login form (tab storage, never the URL). No
  retries; the e-mail and the code live only in memory.

### Usuarios (Owner)

- `GET /hierarchy/users?includeReadOnly=true` adds, for an Owner only, rows with `readOnly: true` (role `DEVELOPER` or
  `OWNER`, no principal, zone or codes, `twoFactorEnabled: null`); the panel asks for them only in an Owner's session
  and only when it shows them. The Rol column shows the API's `label` («Lumarsoft · Developer», «Owner · <shared
  zones>»), or the role's name without one. They render after the managed accounts under «Solo lectura», with «—» in
  those columns, a lock instead of the actions menu, and only when no zone, principal, productor or role filter is on
  (the search still applies). `isManagedUser` / `isReadOnlyUser` (`lib/network-users.ts`) split the list; every form and dialog
  only ever gets managed accounts.
