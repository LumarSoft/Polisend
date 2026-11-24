import { apiRequest } from '@/lib/api-client'
import type { ChatStartClient, ChatStartSenders, StartChatRequest, StartChatResult } from '@/types/api/chat-start'

/** Whatsapp → Nuevo chat: writing first to a client with the template Meta approved. */
export const chatStartService = {
  clients(token: string, query: { search?: string; conversationId?: number }): Promise<ChatStartClient[]> {
    const params = new URLSearchParams()
    if (query.search?.trim()) params.set('search', query.search.trim())
    if (query.conversationId) params.set('conversationId', String(query.conversationId))
    return apiRequest<ChatStartClient[]>(`/admin/chat-start/clients?${params.toString()}`, { token })
  },

  senders(token: string, conversationId?: number): Promise<ChatStartSenders> {
    const qs = conversationId ? `?conversationId=${conversationId}` : ''
    return apiRequest<ChatStartSenders>(`/admin/chat-start/senders${qs}`, { token })
  },

  preview(token: string, policyId: number, senderId?: number): Promise<{ text: string }> {
    const params = new URLSearchParams({ policyId: String(policyId) })
    if (senderId) params.set('senderId', String(senderId))
    return apiRequest<{ text: string }>(`/admin/chat-start/preview?${params.toString()}`, { token })
  },

  start(token: string, data: StartChatRequest): Promise<StartChatResult> {
    return apiRequest<StartChatResult>('/admin/chat-start', { method: 'POST', token, body: data })
  },
}
