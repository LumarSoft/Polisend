import { apiRequest } from '@/lib/api-client'
import type { RiskType } from '@/types/api/clients'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export const SINIESTRO_TIPOS = ['auto', 'hogar', 'robo', 'otro'] as const
export type SiniestroTipo = (typeof SINIESTRO_TIPOS)[number]

export const SINIESTRO_ESTADOS = ['pending', 'in_progress', 'resolved'] as const
export type SiniestroEstado = (typeof SINIESTRO_ESTADOS)[number]

export interface Adjunto {
  filename: string
  originalName: string
  url: string
  mimeType: string
  size: number
}

// Resolves a stored attachment URL (which is API-relative) to an absolute URL.
export function adjuntoUrl(adjunto: Adjunto): string {
  return adjunto.url.startsWith('http') ? adjunto.url : `${API_URL}${adjunto.url}`
}

export interface AdminSiniestroVehiculo {
  licensePlate: string | null
  brand: string | null
  model: string | null
}

export interface AdminSiniestroDetail {
  id: number
  type: SiniestroTipo
  description: string
  occurredAt: string
  status: SiniestroEstado
  insurerClaimNumber: string | null
  attachments: Adjunto[] | null
  createdAt: string
  updatedAt: string
  client: {
    id: number
    firstName: string
    lastName: string
    dni: string
    email: string | null
    phone: string | null
  }
  policy: {
    id: number
    certificateNumber: string
    company: string
    riskType: RiskType
    vehicle: AdminSiniestroVehiculo | null
  }
}

export interface UpdateSiniestroInput {
  status?: SiniestroEstado
  insurerClaimNumber?: string
}

export type SiniestroEstadoFilter = SiniestroEstado | 'todos'

export interface AdminSiniestrosQuery {
  status?: SiniestroEstado
  search?: string
  // SuperAdmin section filter: by producer code OR by phone number/sucursal.
  producerCodeId?: number
  phoneNumberId?: number
  page?: number
  pageSize?: number
}

export interface AdminSiniestrosPage {
  data: AdminSiniestroDetail[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AdminSiniestrosStats {
  pending: number
  inProgress: number
  resolved: number
  withoutInsurerNumber: number
}

function buildSiniestrosQuery(params: AdminSiniestrosQuery): string {
  const sp = new URLSearchParams()
  if (params.status) sp.set('status', params.status)
  if (params.search?.trim()) sp.set('search', params.search.trim())
  if (params.producerCodeId) sp.set('producerCodeId', String(params.producerCodeId))
  if (params.phoneNumberId) sp.set('phoneNumberId', String(params.phoneNumberId))
  if (params.page) sp.set('page', String(params.page))
  if (params.pageSize) sp.set('pageSize', String(params.pageSize))
  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

export const adminSiniestrosService = {
  list: (params: AdminSiniestrosQuery, token: string) =>
    apiRequest<AdminSiniestrosPage>(`/admin/siniestros${buildSiniestrosQuery(params)}`, { token }),
  stats: (token: string) => apiRequest<AdminSiniestrosStats>('/admin/siniestros/stats', { token }),
  get: (id: number, token: string) => apiRequest<AdminSiniestroDetail>(`/admin/siniestros/${id}`, { token }),
  update: (id: number, input: UpdateSiniestroInput, token: string) =>
    apiRequest<AdminSiniestroDetail>(`/admin/siniestros/${id}`, { method: 'PATCH', token, body: input }),
}
