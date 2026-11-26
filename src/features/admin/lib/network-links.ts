/**
 * Links from the network screens to Usuarios. `?principal=<id>` filters the list by that principal (plan §6.4);
 * `&grupo=<id>` narrows it to one group of a principal shown as its groups (a zone's principal);
 * `&nuevo=superadmin` asks it to open "Nuevo usuario" as SuperAdmin of that principal («Sin SuperAdmin · crear uno»).
 */
export const USERS_PRINCIPAL_PARAM = 'principal'
export const USERS_GROUP_PARAM = 'grupo'
export const USERS_NEW_PARAM = 'nuevo'
export const USERS_NEW_SUPERADMIN = 'superadmin'

export function networkUsersHref(
  principalId: number,
  { newSuperAdmin = false, groupId = null }: { newSuperAdmin?: boolean; groupId?: number | null } = {},
) {
  const params = new URLSearchParams({ [USERS_PRINCIPAL_PARAM]: String(principalId) })
  if (groupId !== null) params.set(USERS_GROUP_PARAM, String(groupId))
  if (newSuperAdmin) params.set(USERS_NEW_PARAM, USERS_NEW_SUPERADMIN)
  return `/admin/usuarios?${params.toString()}`
}
