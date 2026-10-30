import type { AdminClientsQuery } from '@/types/api/clients'
import type { CobranzasQuery } from '@/types/api/cobranzas'
import type { ExpiredPoliciesQuery } from '@/types/api/expired-policies'
import type {
  ImprovementsQuery,
  OwnerImprovementsQuery,
  OwnerProposalsQuery,
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
    billingPlans: ['admin', 'billing', 'plans'] as const,
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
    improvements: (params?: ImprovementsQuery) => ['admin', 'improvements', 'list', params ?? {}] as const,
    improvementsUnseen: ['admin', 'improvements', 'unseen'] as const,
    proposalsAll: ['admin', 'improvement-proposals'] as const,
    proposals: (params?: PageQuery) => ['admin', 'improvement-proposals', 'list', params ?? {}] as const,
    tasksAll: ['admin', 'tasks'] as const,
    tasks: (params: TasksQuery) => ['admin', 'tasks', 'list', params] as const,
    tasksStats: ['admin', 'tasks', 'stats'] as const,
    taskPeople: ['admin', 'tasks', 'people'] as const,
    rejectionsAll: ['admin', 'rejections'] as const,
    rejectionImports: ['admin', 'rejections', 'list'] as const,
    rejectionImport: (id: number) => ['admin', 'rejections', 'detail', id] as const,
  },
  owner: {
    organizations: ['owner', 'organizations'] as const,
    organization: (id: number) => ['owner', 'organizations', id] as const,
    organizationTriunfo: (id: number) => ['owner', 'organizations', id, 'triunfo'] as const,
    improvementsAll: ['owner', 'improvements'] as const,
    improvements: (params?: OwnerImprovementsQuery) => ['owner', 'improvements', 'list', params ?? {}] as const,
    proposalsAll: ['owner', 'improvement-proposals'] as const,
    proposals: (params?: OwnerProposalsQuery) => ['owner', 'improvement-proposals', 'list', params ?? {}] as const,
    proposalsNew: ['owner', 'improvement-proposals', 'new'] as const,
  },
} as const
