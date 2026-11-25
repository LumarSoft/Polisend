'use client'

import { useState, type FormEvent } from 'react'
import { Loader2, Search, SendHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { ChatStartClient } from '@/types/api/chat-start'
import type { InboxConversation } from '@/types/api/inbox'
import { useChatStartClients, useChatStartPreview, useChatStartSenders, useStartChat } from '../hooks/use-chat-start'

const SELECT =
  'h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30'

interface Props {
  /** A chat whose 24 h are over: the message goes to its number. Without one, a new chat. */
  conversation?: InboxConversation
  onClose: () => void
  onStarted: (conversationId: number) => void
}

/**
 * Writing first to a client (Nuevo chat) or again to a chat with no client
 * linked: WhatsApp only allows it with a message Meta approved, which greets
 * the client by name. The chat is then taken by whoever sent it.
 */
export function ChatStartDialog({ conversation, onClose, onStarted }: Readonly<Props>) {
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput, 300)
  const [pickedClient, setPickedClient] = useState<ChatStartClient | null>(null)
  const [phoneInput, setPhoneInput] = useState<string | null>(null)
  const [pickedSenderId, setPickedSenderId] = useState<number | null>(null)

  const linked = useChatStartClients('', conversation?.id)
  const found = useChatStartClients(search)
  const senders = useChatStartSenders(conversation?.id)
  const start = useStartChat()

  // A chat with a client linked starts on that client; any other is searched.
  const client = pickedClient ?? (conversation ? (linked.data?.[0] ?? null) : null)
  const searching = !client && (!conversation || linked.isSuccess)
  const phone = phoneInput ?? client?.phone ?? ''
  const senderList = senders.data?.senders ?? []
  const senderId = pickedSenderId ?? senders.data?.defaultId ?? undefined
  const anyReady = senderList.some(s => s.ready)
  const preview = useChatStartPreview(client?.id ?? null, senderId)

  const pickClient = (next: ChatStartClient | null) => {
    setPickedClient(next)
    setPhoneInput(null)
  }

  // A chat goes out from its own number: only a new one picks the number and the phone.
  const canSend = !!client && (conversation ? true : senderId !== undefined && !!phone.trim())

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSend || !client || start.isPending) return
    start.mutate(
      conversation
        ? { clientId: client.id, conversationId: conversation.id }
        : { clientId: client.id, senderId, phone: phone.trim() },
      {
        onSuccess: result => {
          if (result.sent) {
            toast.success('Mensaje enviado. Cuando el cliente responda, vas a poder escribirle libre.')
          } else {
            toast.info('El cliente escribió en las últimas 24 h: podés escribirle directo en el chat.')
          }
          onStarted(result.conversationId)
        },
        // The API explains a refusal (no approved number, a wrong phone, WhatsApp's 502) in the agent's words.
        onError: error =>
          toast.error(
            error instanceof ApiError && (error.status < 500 || error.status === 502)
              ? error.message
              : 'No se pudo enviar el mensaje por WhatsApp. Probá de nuevo.',
          ),
      },
    )
  }

  return (
    <Dialog open onOpenChange={open => !open && !start.isPending && onClose()}>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{conversation ? '¿De quién es este chat?' : 'Nuevo chat'}</DialogTitle>
          <DialogDescription>
            {conversation
              ? 'El mensaje para retomar el chat saluda al asegurado por su nombre, y este chat no está vinculado a ninguno: buscalo para mandarlo.'
              : 'WhatsApp solo deja escribirle primero a alguien con un mensaje aprobado por Meta, que lo saluda por su nombre. Cuando el cliente responda, vas a poder escribirle libre.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="chat-start-search">Asegurado</Label>
            {conversation && linked.isLoading ? (
              <div className="h-9 animate-pulse rounded-lg bg-muted" />
            ) : client ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-line-2 px-3 py-2 text-[13px]">
                <span className="min-w-0">
                  <span className="font-medium text-ink">{client.name}</span>
                  <span className="text-muted-foreground block text-xs">DNI {client.dni}</span>
                </span>
                <button
                  type="button"
                  onClick={() => pickClient(null)}
                  className={cn(
                    'shrink-0 text-xs font-medium text-ember hover:underline',
                    conversation && !pickedClient && 'hidden',
                  )}
                >
                  Cambiar
                </button>
              </div>
            ) : null}
            {searching && (
              <>
                <div className="relative">
                  <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
                  <Input
                    id="chat-start-search"
                    autoFocus
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder="Nombre, DNI, teléfono, póliza o patente"
                    className="h-9 pl-8"
                  />
                </div>
                {search.trim().length >= 2 && (
                  <ul className="max-h-56 overflow-y-auto rounded-lg border border-line-2 empty:hidden">
                    {found.isLoading && (
                      <li className="text-muted-foreground flex items-center gap-2 px-3 py-2 text-[13px]">
                        <Loader2 className="size-4 animate-spin" /> Buscando…
                      </li>
                    )}
                    {found.isSuccess && found.data.length === 0 && (
                      <li className="text-muted-foreground px-3 py-2 text-[13px]">
                        No hay asegurados de tu cartera con esa búsqueda.
                      </li>
                    )}
                    {found.data?.map(c => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => pickClient(c)}
                          className="w-full border-b border-line-2 px-3 py-2 text-left text-[13px] last:border-b-0 hover:bg-muted"
                        >
                          <span className="font-medium text-ink">{c.name}</span>
                          <span className="text-muted-foreground block text-xs">
                            DNI {c.dni} · {c.policies.length === 1 ? '1 póliza' : `${c.policies.length} pólizas`}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          {client && (
            <>
              {!conversation && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="chat-start-phone">Celular</Label>
                  <>
                    <Input
                      id="chat-start-phone"
                      value={phone}
                      onChange={e => setPhoneInput(e.target.value)}
                      placeholder="341 555-1234"
                      inputMode="tel"
                      maxLength={30}
                      className="h-9"
                    />
                    <p className="text-muted-foreground text-xs">
                      {client.phone
                        ? 'El de la ficha del asegurado. Podés cambiarlo si le escribís a otro celular.'
                        : 'La ficha no tiene celular: escribilo con la característica.'}
                    </p>
                  </>
                </div>
              )}
            </>
          )}

          <div className="flex flex-col gap-1.5">
            {!conversation && <Label htmlFor="chat-start-sender">Sale desde</Label>}
            {conversation ? null : senders.isLoading ? (
              <div className="h-9 animate-pulse rounded-lg bg-muted" />
            ) : senderList.length === 0 ? (
              <p className="text-muted-foreground text-[13px]">No tenés números de WhatsApp conectados.</p>
            ) : (
              <select
                id="chat-start-sender"
                value={senderId ?? ''}
                onChange={e => setPickedSenderId(Number(e.target.value))}
                className={SELECT}
              >
                {senderId === undefined && <option value="">Elegí un número</option>}
                {senderList.map(s => (
                  <option key={s.id} value={s.id} disabled={!s.ready}>
                    {s.ready ? s.label : `${s.label} (esperando aprobación de Meta)`}
                  </option>
                ))}
              </select>
            )}
            {senders.isSuccess && senderList.length > 0 && !anyReady && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                Meta todavía no aprobó el mensaje en la cuenta de WhatsApp de tus números. Se pide solo y Meta lo revisa
                en un rato (hasta un día). Mientras tanto no se pueden iniciar chats.
              </p>
            )}
          </div>

          {client && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Mensaje que va a recibir</span>
              {preview.isLoading ? (
                <div className="h-16 animate-pulse rounded-lg bg-muted" />
              ) : preview.data ? (
                <p className="whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 text-[13px] leading-5 text-ink">
                  {preview.data.text}
                </p>
              ) : null}
            </div>
          )}

          <p className="text-muted-foreground text-xs">
            El chat queda tomado por vos, así la respuesta te llega a vos y no al bot. Meta cobra cada chat que inicia
            la oficina.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={start.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSend || !anyReady || start.isPending} className="gap-2">
              {start.isPending ? <Loader2 className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}
              Enviar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
