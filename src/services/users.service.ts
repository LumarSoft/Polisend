import { apiRequest } from '@/lib/api-client'
import type { ProducerCodeOption } from '@/types/api/users'

/**
 * The acting principal's own lists under `/users`. Accounts are managed through `/hierarchy/users`
 * (hierarchy.service.ts): the old `/users` CRUD is no longer called by the panel.
 */
export const usersService = {
  listProducerCodes: (token: string): Promise<ProducerCodeOption[]> =>
    apiRequest<ProducerCodeOption[]>('/users/producer-codes', { token }),
}
