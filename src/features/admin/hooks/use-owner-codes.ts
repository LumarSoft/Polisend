import { useQuery } from '@tanstack/react-query'
import { ownerCodesService } from '@/services/owner-codes.service'
import { QUERY_KEYS } from '@/lib/query-keys'
import { useAuth } from '../context/auth-context'

/** The codes that have others below them (owner). */
export function useOwnerCodes(enabled = true) {
  const { token } = useAuth()

  return useQuery({
    queryKey: QUERY_KEYS.owner.codes,
    queryFn: () => ownerCodesService.list(token as string),
    enabled: !!token && enabled,
  })
}

/** A code and every code that depends on it (owner). */
export function useOwnerCodeTree(code: string | null) {
  const { token } = useAuth()

  return useQuery({
    queryKey: QUERY_KEYS.owner.code(code ?? ''),
    queryFn: () => ownerCodesService.tree(token as string, code as string),
    enabled: !!token && !!code,
    retry: false,
  })
}
