import type { CampaignCandidatesQuery, CampaignKind, CampaignResultsQuery } from '@/types/api/campaigns'
import type { BalanceQuery } from '@/types/api/balance'
import type { AdminClientsQuery } from '@/types/api/clients'
import type { CobranzasQuery } from '@/types/api/cobranzas'
import type { ExpiredPoliciesQuery } from '@/types/api/expired-policies'
import type { NoticeTextKind } from '@/types/api/notice-texts'
import type { NetworkUsersQuery } from '@/types/api/hierarchy'
import type {
  ImprovementsQuery,
  PlatformImprovementsQuery,
  PlatformProposalsQuery,
  PageQuery,
} from '@/types/api/improvements'
import type { NovedadesQuery } from '@/types/api/novedades'
import type { SolicitudesQuery } from '@/types/api/solicitudes'
import type { TasksQuery } from '@/types/api/tasks'
import type { AdminSiniestrosQuery } from '@/services/siniestros.service'

export const QUERY_KEYS = {
  inbox: {
    conversations: (status?: string, search?: string, scope?: { producerCodeId?: number; phoneNumberId?: number }) =>
      ['admin', 'inbox', 'list', status ?? 'all', search ?? '', scope ?? {}] as const,
    messages: (id: number) => ['admin', 'inbox', id, 'messages'] as const,
  },
  admin: {
    dashboard: ['admin', 'dashboard'] as const,
    balance: (params: BalanceQuery) => ['admin', 'balance', params] as const,
    profile: ['admin', 'profile'] as const,
    config: ['admin', 'config'] as const,
    botProfile: ['admin', 'config', 'profile'] as const,
    users: ['admin', 'users'] as const,
    producerCodes: ['admin', 'producer-codes'] as const,
    phoneNumbers: ['admin', 'phone-numbers'] as const,
    numberAssistant: (id: number) => ['admin', 'phone-numbers', id, 'assistant'] as const,
    embeddedSignupConfig: ['admin', 'embedded-signup-config'] as const,
    clients: (params?: AdminClientsQuery) => ['admin', 'clients', 'list', params ?? {}] as const,
    clientsStats: ['admin', 'clients', 'stats'] as const,
    client: (id: number) => ['admin', 'clients', id] as const,
    clientPolizaDocumentos: (clientId: number, polizaId: number) =>
      ['admin', 'clients', clientId, 'polizas', polizaId, 'documentos'] as const,
    cobranzas: (params?: CobranzasQuery) => ['admin', 'cobranzas', 'list', params ?? {}] as const,
    cobranzasStats: (params?: Pick<CobranzasQuery, 'producerCodeId' | 'phoneNumberId' | 'paymentMethod'>) =>
      ['admin', 'cobranzas', 'stats', params ?? {}] as const,
    expiredPoliciesAll: ['admin', 'cobranzas', 'vencidas'] as const,
    billingAll: ['admin', 'billing'] as const,
    billing: (period?: string) => ['admin', 'billing', 'overview', period ?? 'current'] as const,
    /** An Owner reading one principal of its network other than the acting one (a number's plan). */
    billingOfPrincipal: (principalId: number, period?: string) =>
      ['admin', 'billing', 'principal', principalId, period ?? 'current'] as const,
    billingByAdmin: (period?: string) => ['admin', 'billing', 'by-admin', period ?? 'current'] as const,
    planFeatures: ['admin', 'billing', 'features'] as const,
    expiredPolicies: (params?: ExpiredPoliciesQuery) =>
      ['admin', 'cobranzas', 'vencidas', 'list', params ?? {}] as const,
    novedades: (params?: NovedadesQuery) => ['admin', 'novedades', 'list', params ?? {}] as const,
    novedadesStats: ['admin', 'novedades', 'stats'] as const,
    siniestros: (params?: AdminSiniestrosQuery) => ['admin', 'siniestros', 'list', params ?? {}] as const,
    siniestrosStats: ['admin', 'siniestros', 'stats'] as const,
    siniestro: (id: number) => ['admin', 'siniestros', id] as const,
    solicitudes: (params?: SolicitudesQuery) => ['admin', 'solicitudes', 'list', params ?? {}] as const,
    solicitud: (kind: string, id: number) => ['admin', 'solicitudes', kind, id] as const,
    solicitudMessages: (kind: string, id: number) => ['admin', 'solicitudes', kind, id, 'messages'] as const,
    pricingPlans: ['admin', 'pricing'] as const,
    businessHours: ['admin', 'business-hours'] as const,
    coverageSettings: ['admin', 'coverage-settings'] as const,
    motoCoverages: ['admin', 'moto-coverages'] as const,
    improvements: (params?: ImprovementsQuery) => ['admin', 'improvements', 'list', params ?? {}] as const,
    improvementsUnseen: ['admin', 'improvements', 'unseen'] as const,
    proposalsAll: ['admin', 'improvement-proposals'] as const,
    proposals: (params?: PageQuery) => ['admin', 'improvement-proposals', 'list', params ?? {}] as const,
    tasksAll: ['admin', 'tasks'] as const,
    tasks: (params: TasksQuery) => ['admin', 'tasks', 'list', params] as const,
    tasksStats: ['admin', 'tasks', 'stats'] as const,
    taskPeople: ['admin', 'tasks', 'people'] as const,
    campaignsAll: ['admin', 'campaigns'] as const,
    campaigns: ['admin', 'campaigns', 'list'] as const,
    campaignCandidates: (kind: CampaignKind, params: CampaignCandidatesQuery) =>
      ['admin', 'campaigns', 'candidates', kind, params] as const,
    campaignResults: (params: CampaignResultsQuery) => ['admin', 'campaigns', 'results', params] as const,
    noticeText: (kind: NoticeTextKind) => ['admin', 'notice-texts', kind] as const,
    rejectionsAll: ['admin', 'rejections'] as const,
    rejectionImports: ['admin', 'rejections', 'list'] as const,
    rejectionImport: (id: number) => ['admin', 'rejections', 'detail', id] as const,
    triunfoStatus: ['admin', 'triunfo', 'status'] as const,
    triunfoCredential: ['admin', 'triunfo', 'credential'] as const,
    status: ['admin', 'status'] as const,
    assistantConversations: ['admin', 'assistant', 'conversations'] as const,
    assistantConversation: (id: number) => ['admin', 'assistant', 'conversations', id] as const,
  },
  platform: {
    organizations: ['platform', 'organizations'] as const,
    organization: (id: number) => ['platform', 'organizations', id] as const,
    organizationTriunfo: (id: number) => ['platform', 'organizations', id, 'triunfo'] as const,
    organizationTriunfoErrors: (id: number) => ['platform', 'organizations', id, 'triunfo', 'errors'] as const,
    plans: ['platform', 'plans'] as const,
    featureRoles: ['platform', 'plans', 'feature-roles'] as const,
    templates: ['platform', 'templates'] as const,
    billingAll: ['platform', 'billing'] as const,
    billing: (period?: string) => ['platform', 'billing', period ?? 'current'] as const,
    settlementAll: ['platform', 'settlement'] as const,
    settlement: (period?: string) => ['platform', 'settlement', 'month', period ?? 'current'] as const,
    settlementSeries: ['platform', 'settlement', 'series'] as const,
    improvementsAll: ['platform', 'improvements'] as const,
    improvements: (params?: PlatformImprovementsQuery) => ['platform', 'improvements', 'list', params ?? {}] as const,
    proposalsAll: ['platform', 'improvement-proposals'] as const,
    proposals: (params?: PlatformProposalsQuery) =>
      ['platform', 'improvement-proposals', 'list', params ?? {}] as const,
    proposalsNew: ['platform', 'improvement-proposals', 'new'] as const,
    zones: ['platform', 'zones'] as const,
    owners: ['platform', 'owners'] as const,
  },
  /** The network (/hierarchy/*): not tied to the acting principal. */
  hierarchy: {
    all: ['hierarchy'] as const,
    /** The cascading filter's list. The acting-principal provider keeps its own copy outside each principal's cache. */
    principals: ['hierarchy', 'principals'] as const,
    tree: ['hierarchy', 'tree'] as const,
    usageAll: ['hierarchy', 'usage'] as const,
    usage: (period?: string) => ['hierarchy', 'usage', period ?? 'current'] as const,
    usersAll: ['hierarchy', 'users'] as const,
    users: (query?: NetworkUsersQuery) => ['hierarchy', 'users', 'list', query ?? {}] as const,
  },
  auth: {
    /** The public /admin/activar page (the token itself never goes in a key). */
    passwordSetup: ['auth', 'password-setup'] as const,
  },
} as const
