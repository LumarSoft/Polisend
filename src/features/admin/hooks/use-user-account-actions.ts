import { toast } from 'sonner'
import type { NetworkUser } from '@/types/api/hierarchy'
import { networkErrorMessage } from '../lib/network-user-errors'
import { useNetworkUserActions } from './use-hierarchy'

/**
 * What a manager does to an account without editing it, with its toasts: mail it a link to choose a password (any
 * manager, the Developer included), reset its two-step verification (Owner or SuperAdmin), delete it.
 */
export function useUserAccountActions() {
  const { sendPasswordSetup, resetTwoFactor, removeUser } = useNetworkUserActions()

  const sendPasswordLink = (user: Pick<NetworkUser, 'id' | 'email'>) =>
    sendPasswordSetup.mutate(user.id, {
      onSuccess: () =>
        toast.success('Enlace enviado', {
          description: `Le llega a ${user.email}. Vence en 72 horas y sirve una sola vez.`,
        }),
      onError: error => toast.error(networkErrorMessage(error, 'No se pudo mandar el enlace. Probá de nuevo.')),
    })

  const resetSecondStep = (user: NetworkUser, onDone: () => void) =>
    resetTwoFactor.mutate(user.id, {
      onSuccess: () => {
        toast.success('Verificación en dos pasos reiniciada', {
          description: `${user.email} entra solo con su contraseña y puede volver a activarla desde Mi cuenta.`,
        })
        onDone()
      },
      onError: error => toast.error(networkErrorMessage(error, 'No se pudo reiniciar la verificación en dos pasos.')),
    })

  const deleteUser = (user: NetworkUser, onDone: () => void) =>
    removeUser.mutate(user.id, {
      onSuccess: () => {
        toast.success(`${user.name || user.email} eliminado`)
        onDone()
      },
      onError: error => toast.error(networkErrorMessage(error, 'No se pudo eliminar el usuario.')),
    })

  return {
    sendPasswordLink,
    sendingPasswordLink: sendPasswordSetup.isPending,
    resetSecondStep,
    resettingSecondStep: resetTwoFactor.isPending,
    deleteUser,
    deleting: removeUser.isPending,
  }
}
