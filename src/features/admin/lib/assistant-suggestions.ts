import {
  BarChart3,
  CalendarClock,
  MessageCircle,
  RefreshCw,
  Smartphone,
  TrendingUp,
  UserRound,
  CalendarOff,
  Clock,
  FileText,
  Inbox,
  Landmark,
  Lightbulb,
  ListTodo,
  Search,
  ShieldAlert,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { AssistantOpenRecord } from '@/types/api/assistant'

/** A question the empty conversation offers. `fill` puts the text in the box to finish it instead of sending it. */
export interface AssistantSuggestion {
  label: string
  icon: LucideIcon
  fill?: string
}

const PENDING: AssistantSuggestion = { label: '¿Qué tengo pendiente hoy?', icon: Inbox }
const BANK: AssistantSuggestion = {
  label: 'Quiero cambiar los datos bancarios donde transfieren los clientes',
  icon: Landmark,
}
const EXPIRING: AssistantSuggestion = { label: '¿Qué pólizas vencen esta semana?', icon: CalendarClock }
const TASK: AssistantSuggestion = { label: 'Creá una tarea para…', icon: ListTodo, fill: 'Creá una tarea para ' }
const CLIENT: AssistantSuggestion = { label: 'Buscá a un asegurado…', icon: Search, fill: 'Mostrame la ficha de ' }
const RANKING: AssistantSuggestion = { label: '¿Qué productor tiene más deuda vencida?', icon: BarChart3 }
const RENEWALS: AssistantSuggestion = { label: '¿Cómo viene la renovación este mes?', icon: RefreshCw }
const TREND: AssistantSuggestion = { label: '¿Cómo vienen las cotizaciones mes a mes?', icon: TrendingUp }
const IDEA: AssistantSuggestion = {
  label: 'Quiero proponer una mejora',
  icon: Lightbulb,
  fill: 'Quiero proponer una mejora: ',
}

/** Suggestions for the screen the person is on; the first match by path prefix wins. */
const BY_SCREEN: Array<[string, AssistantSuggestion[]]> = [
  [
    '/admin/configuracion',
    [
      BANK,
      { label: 'Cambiá el horario de atención de los sábados', icon: Clock, fill: 'Los sábados atendemos de ' },
      { label: '¿Qué datos les da el bot a los clientes?', icon: FileText },
      IDEA,
    ],
  ],
  [
    '/admin/numeros',
    [
      { label: '¿Cuántos tokens usé este mes en cada número?', icon: Wallet },
      { label: 'Cargá un feriado en mis números', icon: CalendarOff, fill: 'Cargá un feriado el ' },
      BANK,
      PENDING,
    ],
  ],
  [
    '/admin/cobranzas',
    [
      { label: '¿Cuánta deuda vencida hay y de quiénes?', icon: Wallet },
      { label: '¿Cómo se reparte la deuda vencida por antigüedad?', icon: BarChart3 },
      { label: '¿Quiénes tienen cuotas rechazadas?', icon: Wallet },
      CLIENT,
    ],
  ],
  [
    '/admin/siniestros',
    [
      { label: '¿Qué siniestros siguen sin N° de la compañía?', icon: ShieldAlert },
      { label: '¿Qué siniestros están pendientes?', icon: ShieldAlert },
      CLIENT,
      TASK,
    ],
  ],
  [
    '/admin/solicitudes',
    [
      { label: '¿Qué solicitudes nuevas hay?', icon: FileText },
      { label: 'Resumime las cotizaciones de esta semana', icon: FileText },
      TASK,
      PENDING,
    ],
  ],
  ['/admin/tareas', [{ label: '¿Qué tareas tengo para hoy?', icon: ListTodo }, TASK, PENDING, IDEA]],
  ['/admin/novedades', [{ label: 'Resumime los asuntos por atender', icon: Inbox }, TASK, PENDING, CLIENT]],
  ['/admin/asegurados', [CLIENT, EXPIRING, { label: '¿Quiénes tienen cuotas vencidas?', icon: Wallet }, TASK]],
  [
    '/admin/balance',
    [RENEWALS, TREND, { label: '¿Cuántas pólizas nuevas entraron el mes pasado?', icon: BarChart3 }, RANKING],
  ],
]

const DEFAULT: AssistantSuggestion[] = [PENDING, RANKING, EXPIRING, RENEWALS]

/** The first suggestion when a sheet is open: a question about that record. */
const FOR_RECORD: Record<AssistantOpenRecord['kind'], AssistantSuggestion> = {
  asegurado: { label: 'Resumime este asegurado', icon: UserRound },
  siniestro: { label: '¿Qué falta para avanzar con este siniestro?', icon: ShieldAlert },
  lead: { label: '¿Cómo sigo con esta solicitud?', icon: FileText },
  cotizacion: { label: '¿Cómo sigo con esta solicitud?', icon: FileText },
  chat: { label: '¿Qué pidió este cliente en el chat?', icon: MessageCircle },
  numero: { label: '¿Cómo está configurado este número?', icon: Smartphone },
}

/** How the panel names what is open, for the chip that says what the assistant sees. */
export const RECORD_LABELS: Record<AssistantOpenRecord['kind'], string> = {
  asegurado: 'la ficha del asegurado',
  siniestro: 'el siniestro',
  lead: 'la solicitud',
  cotizacion: 'la solicitud',
  chat: 'el chat',
  numero: 'el número',
}

export function suggestionsFor(route: string | undefined, record?: AssistantOpenRecord): AssistantSuggestion[] {
  const forScreen = BY_SCREEN.find(([prefix]) => route?.startsWith(prefix))?.[1] ?? DEFAULT
  return record ? [FOR_RECORD[record.kind], ...forScreen.slice(0, 3)] : forScreen
}
