import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService } from '@/services/users.service'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { UpdateUserRequest } from '@/types/api/users'
import { useAuth } from '../context/auth-context'

export function useUpdateUser() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserRequest }) =>
      usersService.update(token as string, id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.users }),
  })
}
