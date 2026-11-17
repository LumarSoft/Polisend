import { useActingPrincipal } from '../context/acting-principal-context'
import { brandOf, type PanelBrand } from '../lib/org-brand'
import { useProfile } from './use-profile'

/**
 * The organization the panel shows (Polisend's brand until the profile loads): the user's own, for an Owner the active
 * principal's (Polisend's while none is chosen), and Polisend's for the Developer.
 */
export function usePanelBrand(): PanelBrand {
  const { data: profile } = useProfile()
  const { isOwnerSession, hasPrincipal } = useActingPrincipal()
  return brandOf(isOwnerSession && !hasPrincipal ? undefined : profile?.organization, profile?.role)
}
