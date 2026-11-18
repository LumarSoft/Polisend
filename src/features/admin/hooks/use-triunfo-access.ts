import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { triunfoService } from '@/services/triunfo.service'
import { QUERY_KEYS } from '@/lib/query-keys'
import type {
  CodeTriunfoCredentialStatus,
  SaveCodeTriunfoCredentialRequest,
  SaveTriunfoWsCredentialRequest,
} from '@/types/api/triunfo'
import { useAuth } from '../context/auth-context'

/** OWNER: its Triunfo web-service user, which reads the novedades of its zones (never the password). */
export function useTriunfoWsCredential(enabled: boolean) {
  const { token } = useAuth()
  return useQuery({
    queryKey: QUERY_KEYS.hierarchy.triunfoWs,
    queryFn: () => triunfoService.wsCredential(token as string),
    enabled: !!token && enabled,
  })
}

export function useSaveTriunfoWsCredential() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SaveTriunfoWsCredentialRequest) => triunfoService.saveWsCredential(token as string, data),
    onSuccess: status => queryClient.setQueryData(QUERY_KEYS.hierarchy.triunfoWs, status),
  })
}

/** The productor codes the user reaches, each with its own TriunfoNet user if it has one. */
export function useTriunfoCodeCredentials(enabled: boolean) {
  const { token } = useAuth()
  return useQuery({
    queryKey: QUERY_KEYS.admin.triunfoCodes,
    queryFn: () => triunfoService.codes(token as string),
    enabled: !!token && enabled,
  })
}

/** Puts one code's new status in the list without asking for the whole list again. */
function useReplaceCodeRow() {
  const queryClient = useQueryClient()
  return (row: CodeTriunfoCredentialStatus) =>
    queryClient.setQueryData<CodeTriunfoCredentialStatus[]>(QUERY_KEYS.admin.triunfoCodes, rows =>
      rows?.map(r => (r.producerCodeId === row.producerCodeId ? row : r)),
    )
}

export function useSaveCodeTriunfoCredential() {
  const { token } = useAuth()
  const replace = useReplaceCodeRow()
  return useMutation({
    mutationFn: ({ producerCodeId, data }: { producerCodeId: number; data: SaveCodeTriunfoCredentialRequest }) =>
      triunfoService.saveCodeCredential(token as string, producerCodeId, data),
    onSuccess: replace,
  })
}

export function useRemoveCodeTriunfoCredential() {
  const { token } = useAuth()
  const replace = useReplaceCodeRow()
  return useMutation({
    mutationFn: (producerCodeId: number) => triunfoService.removeCodeCredential(token as string, producerCodeId),
    onSuccess: replace,
  })
}
