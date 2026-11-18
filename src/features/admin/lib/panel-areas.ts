/**
 * Which part of the panel a path belongs to. The shell keeps each role in its part: the Developer in the platform
 * screens (a pasted cartera URL goes back to Organizaciones), and an Owner's work screens only with a principal chosen.
 */

/** The Developer's whole panel. Anything else redirects to Organizaciones (it never enters a cartera). */
export const DEVELOPER_PATHS = [
  '/admin/organizaciones',
  '/admin/owners',
  '/admin/usuarios',
  '/admin/facturacion',
  '/admin/funciones',
  '/admin/plantillas',
  '/admin/mejoras',
  '/admin/status',
  '/admin/cuenta',
] as const

/**
 * An Owner's screens of the whole network (and its own account): not tied to the acting principal. Its Facturación is
 * the network's (every zone, principal and productor) and its Configuración is global (account, logo, web-service user).
 */
export const OWNER_NETWORK_PATHS = [
  '/admin/red',
  '/admin/usuarios',
  '/admin/cuenta',
  '/admin/facturacion',
  '/admin/configuracion',
] as const

/**
 * Screens of an office's day an Owner does not use (18/11/2026): the menu leaves them out and a pasted URL goes back to
 * Inicio. The Owner keeps Inicio, Asegurados, Cobranzas and Balance mensual of the acting principal; Tareas is the
 * office's own work (Lucas, 18/11).
 */
export const OWNER_HIDDEN_PATHS = [
  '/admin/novedades',
  '/admin/tareas',
  '/admin/inbox',
  '/admin/campanas',
  '/admin/solicitudes',
  '/admin/siniestros',
  '/admin/rechazos',
  '/admin/numeros',
] as const

/**
 * Work screens that render the cascading filter (`SectionScopeFilter` or `NetworkFilter`) and `RequirePrincipal`
 * themselves. For an Owner without a principal, the shell shows RequirePrincipal's message (with the filter) in place
 * of any other work screen, so none loads data without a principal. Add a screen here when it gets its filter.
 */
export const SCREENS_WITH_NETWORK_FILTER: readonly string[] = [
  '/admin/asegurados',
  // Inicio ('/admin') is not listed: matchesPath would take every path below it. The shell's guard covers it.
  '/admin/cobranzas',
  '/admin/balance',
  '/admin/inbox',
  '/admin/novedades',
  '/admin/siniestros',
  '/admin/solicitudes',
  '/admin/campanas',
  '/admin/rechazos',
  '/admin/numeros',
  '/admin/tareas',
  '/admin/facturacion',
  '/admin/configuracion',
  '/admin/status',
  '/admin/mejoras',
]

/** Whether `pathname` is one of `paths` or below one ("/admin/red" covers "/admin/red/consumo"). */
export function matchesPath(pathname: string, paths: readonly string[]): boolean {
  return paths.some(path => pathname === path || pathname.startsWith(`${path}/`))
}
