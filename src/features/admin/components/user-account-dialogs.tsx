'use client'

import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { NetworkUser } from '@/types/api/hierarchy'
import { useNetworkUserActions } from '../hooks/use-hierarchy'
import { apiErrorMessage } from '../lib/api-error-message'
import { roleLabel } from '../lib/roles'

interface TargetDialogProps {
  user: NetworkUser | null
  onClose: () => void
}

function who(user: NetworkUser | null) {
  return <span className="font-medium text-ink">{user ? user.name || user.email : ''}</span>
}

/** "Eliminar": its own dialog (no window.confirm). */
export function DeleteUserDialog({
  user,
  onClose,
  canRestore,
}: TargetDialogProps & {
  /** Owner and SuperAdmin may restore it later; the platform may not. */
  canRestore: boolean
}) {
  const { removeUser } = useNetworkUserActions()
  const deleting = removeUser.isPending
  const deleteUser = (target: NetworkUser) =>
    removeUser.mutate(target.id, {
      onSuccess: () => {
        toast.success(`${target.name || target.email} eliminado`)
        onClose()
      },
      onError: error => toast.error(apiErrorMessage(error, 'No se pudo eliminar el usuario.')),
    })
  return (
    <AlertDialog open={!!user} onOpenChange={open => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
          <AlertDialogDescription>
            {who(user)} ({user ? `${roleLabel(user.role)} de ${user.principal.name}` : ''}) deja de entrar al panel en
            el acto.{' '}
            {canRestore
              ? 'Si después lo volvés a dar de alta con el mismo correo, te vamos a ofrecer restaurarlo.'
              : 'Después solo lo puede restaurar su SuperAdmin o su Owner.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleting}
            onClick={e => {
              e.preventDefault()
              if (user) deleteUser(user)
            }}
            variant="destructive"
          >
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
