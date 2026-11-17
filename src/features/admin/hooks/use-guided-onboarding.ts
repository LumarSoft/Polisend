import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useActingPrincipal } from '../context/acting-principal-context'
import { setUrlParams } from './use-panel-link'

const PARAM = 'alta'

/** The principal "Alta guiada de productor" works in. */
export interface GuidedPrincipal {
  id: number
  name: string
}

/**
 * Starts "Alta guiada de productor en <principal>". Its number, assistant and plan steps act on the active principal,
 * so for an Owner the principal becomes the active one first. That remounts the panel content (each principal has its
 * own cache), so the request rides the remount in the URL (`?principal=<id>&alta=1`) and the remounted screen opens
 * the dialog once that principal is the active one. A SuperAdmin works in its own principal: it opens right away.
 */
export function useGuidedOnboarding() {
  const acting = useActingPrincipal()
  const params = useSearchParams()
  // The principal stays after closing, so the dialog keeps its title while it fades out.
  const [target, setTarget] = useState<GuidedPrincipal | null>(null)
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState<number | null>(null)

  const linkedId = params.get(PARAM) === '1' ? Number(params.get('principal')) : null
  const linked =
    acting.isOwnerSession && linkedId !== null && acting.selection.principalId === linkedId ? acting.principal : null
  const linkedPrincipalId = linked?.id ?? null
  if (linkedPrincipalId !== seen) {
    setSeen(linkedPrincipalId)
    if (linked) {
      setTarget({ id: linked.id, name: linked.name })
      setOpen(true)
    }
  }

  const start = (principal: GuidedPrincipal) => {
    if (!acting.isOwnerSession || acting.selection.principalId === principal.id) {
      setTarget(principal)
      setOpen(true)
      return
    }
    acting.selectPrincipal(principal.id)
    // After the selection dropped the previous principal's params.
    setUrlParams({ principal: String(principal.id), [PARAM]: '1' })
  }

  const close = () => {
    setOpen(false)
    setUrlParams({ [PARAM]: null })
  }

  return { target, open, start, close }
}
