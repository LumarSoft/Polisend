# Developer, Owner and zones

How the panel splits the platform from the carteras. The plan is `docs/PLAN-OWNER-ZONAS.md` (§6) in the `john/`
folder above; the API contract is `docs/handoff/owner-zones-step3/contract-final.md` and its addendum.

## Roles

| Role | Who | Panel |
|---|---|---|
| `DEVELOPER` | Lumar, the platform | Platform screens only. Sees money. Never enters a cartera. |
| `OWNER` | Owner of a network of zones | "Mi red", "Usuarios" and "Consumo de la red", then the SuperAdmin menu of the acting principal. Never sees an amount. |
| `SUPERADMIN` | Runs one principal | As before. "Usuarios" adds a "Productores" tab. |
| `ADMIN` | Works some codes of one principal | Unchanged. |

- No role literal outside `lib/roles.ts` and `src/types/api/`. An ESLint rule enforces it. Use `useRole()`
  (`isDeveloper`, `isOwner`, `isSuperAdmin`, `isAdmin`, `canManageOrg`, `seesMoney`) or `ROLES`.
- Labels: `Developer · Lumar`, `Owner`, `SuperAdmin`, `Admin` (`roleLabel`).
- Money (`USD`, price, cost, margin, profit, budget) renders only when `seesMoney` is true, that is, for the
  Developer. The Owner, SuperAdmin and Admin see message counts and plan names.

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
| `/admin/red/consumo` | Owner | Consumo de la red: plan, plan messages, sent and campaign messages. No amount. |
| `/admin/usuarios` | Developer, Owner, SuperAdmin | One screen and one form for SuperAdmins and Admins. `?principal=<id>` preselects one. |
| `/admin/owners` | Developer | Owners y zonas: Owners with their zones and «2 pasos» badge; zones. |
| `/admin/cuenta` | Every role | Mi cuenta, with «Verificación en dos pasos». The only Configuración screen of the Developer. |
| `/admin/activar` | Public | Choose a password from a mailed link. Outside `(panel)`. |

- `DEVELOPER_PATHS` (`lib/panel-areas.ts`) is the Developer's whole panel. Any other path, a pasted cartera URL
  included, goes back to Organizaciones, and no tenant request fires.

## What changed for each role

- **Developer.**
  - Organizaciones gets a Zona column and selector. Its detail links to Usuarios instead of listing users.
  - "Nueva organización" uses the new-principal form, with an optional first account by invitation.
  - Facturación → Tablero groups Owner › Zona › Principal, plus "Sin zona", with billed, cost at 0.04/0.08, profit
    and the real Meta and OpenAI cost.
  - New screens: Owners y zonas, and Usuarios for every principal.
- **Owner.**
  - Home is Mi red.
  - Above the SuperAdmin menu of the acting principal, a "Mi red" group: Mi red, Usuarios and Consumo de la red.
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

Any `PLATFORM_*` refusal the API still returns is shown with the API's Spanish message (`apiErrorMessage`).
Owner and SuperAdmin keep their rules: they may type a password (empty = invitation), edit the e-mail, and never
move an account to another principal.
