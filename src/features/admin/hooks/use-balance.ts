import { useQuery } from '@tanstack/react-query'
import { balanceService } from '@/services/balance.service'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { BalanceQuery } from '@/types/api/balance'
import { useAuth } from '../context/auth-context'

/** The closed months of the balance for the section filter in use. */
export function useBalance(query: BalanceQuery) {
  const { token } = useAuth()

  return useQuery({
    queryKey: QUERY_KEYS.admin.balance(query),
    queryFn: () => balanceService.get(token as string, query),
    enabled: !!token,
  })
}
