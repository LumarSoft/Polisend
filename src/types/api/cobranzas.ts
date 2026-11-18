import type { RiskType } from './clients'

export type CobranzaEstadoFilter = 'vencidas' | 'rechazadas' | 'pendientes' | 'todas'

/**
 * The order of the two cobranzas worklists, by how long ago the cuota (or the policy) fell due.
 * `recent`: the latest first, what the panel opens with. `oldest`: the longest overdue first (the API's default).
 */
export type CobranzaSort = 'oldest' | 'recent'

export interface CobranzaCliente {
  id: number
  firstName: string
  lastName: string
  dni: string
  email: string | null
  phone: string | null
  riskTypes: RiskType[]
  /** Medios de pago of the policies counted, as Triunfo names them ("Plan De Pago", "Convenio"…). */
  paymentMethods: string[]
  licensePlate: string | null
  pendingCount: number
  overdueCount: number
  rejectedCount: number
  paidCount: number
  totalDebt: string
  oldestOverdueDate: string | null
}

export interface CobranzasPage {
  data: CobranzaCliente[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CobranzasStats {
  clientsWithDebt: number
  clientsWithOverdue: number
  clientsWithRejected: number
  clientsWithPending: number
  overdueInstallments: number
  rejectedInstallments: number
  pendingInstallments: number
  totalDebt: string
  /** The medios de pago found on the policies in scope, for the filter. */
  paymentMethods: string[]
}

/** The filters the list and its stats share, so the KPIs follow the list. */
export interface CobranzasScopeQuery {
  // Section filter: by producer code OR by phone number/sucursal.
  producerCodeId?: number
  phoneNumberId?: number
  /** A code group of the principal (a zone's organizer or independent productor shown as a principal). */
  codeGroupId?: number
  /** One of `CobranzasStats.paymentMethods`. */
  paymentMethod?: string
}

export interface CobranzasQuery extends CobranzasScopeQuery {
  search?: string
  status?: CobranzaEstadoFilter
  sort?: CobranzaSort
  page?: number
  pageSize?: number
}
