export type ImprovementArea = 'BOT' | 'BANDEJA' | 'COTIZADOR' | 'PANEL' | 'PORTAL'

export const IMPROVEMENT_AREAS: ImprovementArea[] = ['BOT', 'BANDEJA', 'COTIZADOR', 'PANEL', 'PORTAL']

export const IMPROVEMENT_AREA_LABEL: Record<ImprovementArea, string> = {
  BOT: 'Bot de WhatsApp',
  BANDEJA: 'Whatsapp',
  COTIZADOR: 'Cotizador',
  PANEL: 'Panel',
  PORTAL: 'Portal de clientes',
}

/** One step of an improvement's guide, shown on its screen. */
export interface ImprovementStep {
  title: string
  text: string | null
  /** `data-help` anchor of the element the step rings; null = a card in the middle of the screen. */
  target: string | null
  /** The step moves on when the person taps the element (it opens what the next step points at). */
  waitForClick: boolean
}

export const MAX_GUIDE_STEPS = 6

export interface Improvement {
  id: number
  title: string
  summary: string
  beforeText: string | null
  afterText: string | null
  example: string | null
  area: ImprovementArea
  /** Date of the change (ISO, midnight UTC). */
  releasedOn: string | null
  /** Null = draft (only the Developer sees it). */
  publishedAt: string | null
  /** Panel screen id (`whatsapp`) where it is announced once to each user; null = only listed in Mejoras. */
  screen: string | null
  /** Its step-by-step guide on that screen; null = none. */
  steps: ImprovementStep[] | null
}

/** An improvement announced on a screen: its card shows there once, and its guide replays from Mejoras. */
export interface ImprovementGuide {
  id: number
  title: string
  summary: string
  area: ImprovementArea
  screen: string
  steps: ImprovementStep[]
  releasedOn: string | null
  publishedAt: string | null
  /** Its notice may show now (recent, and to this kind of user); whether this browser closed it is local. */
  announce: boolean
}

export interface PlatformImprovement extends Improvement {
  producerId: number | null
  producer: { id: number; name: string } | null
  createdAt: string
  updatedAt: string
}

/** One page of a "Mejoras" list (same shape as the other paginated admin lists). */
export interface ImprovementsListPage<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PageQuery {
  page: number
  pageSize: number
}

export interface ImprovementsQuery extends PageQuery {
  area?: ImprovementArea
}

export interface ImprovementsPage extends ImprovementsListPage<Improvement> {
  /** Published improvements per area, regardless of the area filter (for the chips). */
  areaCounts: Record<ImprovementArea, number>
}

export type PlatformImprovementFilter = 'all' | 'drafts' | 'published'

export interface PlatformImprovementsQuery extends PageQuery {
  filter: PlatformImprovementFilter
}

export interface PlatformImprovementsPage extends ImprovementsListPage<PlatformImprovement> {
  /** Size of each status list, regardless of the filter (for the chips). */
  counts: Record<PlatformImprovementFilter, number>
}

export interface ImprovementsVisit {
  previousVisitAt: string | null
  visitedAt: string
  /** Published since the previous visit (all of them on a first visit). */
  newCount: number
}

export interface ImprovementRequest {
  title: string
  summary: string
  beforeText: string
  afterText: string
  example: string
  area: ImprovementArea
  /** YYYY-MM-DD or null. */
  releasedOn: string | null
  /** Null = every organization. */
  producerId: number | null
  /** Null = no announcement. */
  screen: string | null
  /** Null or empty = no guide (a guide needs its screen). */
  steps: ImprovementStep[] | null
  published?: boolean
}

export type ProposalStatus = 'NEW' | 'REVIEWING' | 'PLANNED' | 'DONE' | 'DISCARDED'

export const PROPOSAL_STATUSES: ProposalStatus[] = ['NEW', 'REVIEWING', 'PLANNED', 'DONE', 'DISCARDED']

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  NEW: 'Nueva',
  REVIEWING: 'En análisis',
  PLANNED: 'Planificada',
  DONE: 'Hecha',
  DISCARDED: 'Descartada',
}

export interface Proposal {
  id: number
  title: string
  description: string
  status: ProposalStatus
  /** Lumar's answer, visible to the whole organization. */
  response: string | null
  respondedAt: string | null
  createdAt: string
  author: { email: string } | null
  /** True when the current user proposed it. */
  mine: boolean
}

export interface PlatformProposal extends Omit<Proposal, 'mine'> {
  producer: { id: number; name: string }
}

export type PlatformProposalFilter = 'open' | 'all'

export interface PlatformProposalsQuery extends PageQuery {
  filter: PlatformProposalFilter
}

export interface PlatformProposalsPage extends ImprovementsListPage<PlatformProposal> {
  /** Size of each list, regardless of the filter (for the chips). */
  counts: Record<PlatformProposalFilter, number>
}

export interface ProposalRequest {
  title: string
  description: string
}

export interface ProposalUpdate {
  status?: ProposalStatus
  response?: string
}
