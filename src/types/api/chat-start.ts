/** A policy the message to start a chat can name. */
export interface ChatStartPolicy {
  id: number
  certificateNumber: string
  /** The plate, else the product or risk. */
  item: string
  validTo: string | null
}

export interface ChatStartClient {
  id: number
  name: string
  dni: string
  phone: string | null
  policies: ChatStartPolicy[]
}

/** A number of the organization the office may write from. */
export interface ChatStartSender {
  /** PhoneNumber id. */
  id: number
  label: string
  /** Meta approved the template in its account: it can start chats now. */
  ready: boolean
}

export interface ChatStartSenders {
  senders: ChatStartSender[]
  defaultId: number | null
}

export interface StartChatRequest {
  /** The client written to; without it, the one linked to the chat (`conversationId`). */
  clientId?: number
  conversationId?: number
  phone?: string
  senderId?: number
}

export interface StartChatResult {
  conversationId: number
  /** False when the client wrote in the last 24 h: nothing was sent, the chat is open. */
  sent: boolean
}
