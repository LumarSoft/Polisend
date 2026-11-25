import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chatStartService } from '@/services/chat-start.service'
import { QUERY_KEYS } from '@/lib/query-keys'
import { useAuth } from '../context/auth-context'
import type { StartChatRequest } from '@/types/api/chat-start'

/** The API's answer when a chat has no client linked: the panel asks whose chat it is. */
export const CHAT_START_NEEDS_POLICY = 'CHAT_START_NEEDS_POLICY'

/** The clients a search finds, or the one linked to the chat being written to again. */
export function useChatStartClients(search: string, conversationId?: number) {
  const { token } = useAuth()
  return useQuery({
    queryKey: QUERY_KEYS.chatStart.clients(search, conversationId),
    queryFn: () => chatStartService.clients(token as string, { search, conversationId }),
    enabled: !!token && (!!conversationId || search.trim().length >= 2),
  })
}

export function useChatStartSenders(conversationId?: number) {
  const { token } = useAuth()
  return useQuery({
    queryKey: QUERY_KEYS.chatStart.senders(conversationId),
    queryFn: () => chatStartService.senders(token as string, conversationId),
    enabled: !!token,
  })
}

export function useChatStartPreview(clientId: number | null, senderId?: number) {
  const { token } = useAuth()
  return useQuery({
    queryKey: QUERY_KEYS.chatStart.preview(clientId ?? 0, senderId),
    queryFn: () => chatStartService.preview(token as string, clientId as number, senderId),
    enabled: !!token && clientId !== null,
  })
}

export function useStartChat() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: StartChatRequest) => chatStartService.start(token as string, data),
    onSuccess: result => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'inbox'] })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inbox.messages(result.conversationId) })
    },
  })
}
