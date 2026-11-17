import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useActingPrincipal } from '../context/acting-principal-context'

const PARAM = 'alta'

/**
 * Changes the query so that Next's useSearchParams follows it, also in the content remounted for another principal.
 * (A replaceState that passes Next's own history state, like setUrlParams does, is taken as Next's and not synced.)
 */
function replaceQuery(changes: Record<string, string | null>): void {
  const url = new URL(window.location.href)
  for (const [name, value] of Object.entries(changes)) {
    if (value === null) url.searchParams.delete(name)
    else url.searchParams.set(name, value)
  }
  window.history.replaceState(null, '', url)
}

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
    replaceQuery({ principal: String(principal.id), [PARAM]: '1' })
  }

  const close = () => {
    setOpen(false)
    replaceQuery({ [PARAM]: null })
  }

  return { target, open, start, close }
}
