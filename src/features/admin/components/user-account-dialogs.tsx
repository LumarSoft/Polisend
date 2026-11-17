'use client'

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
import { useUserAccountActions } from '../hooks/use-user-account-actions'
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
  const { deleteUser, deleting } = useUserAccountActions()
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
              if (user) deleteUser(user, onClose)
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

/** "Reiniciar verificación en dos pasos" (lost phone), with confirmation. Owner or SuperAdmin, never on oneself. */
export function ResetTwoFactorDialog({ user, onClose }: TargetDialogProps) {
  const { resetSecondStep, resettingSecondStep } = useUserAccountActions()
  return (
    <AlertDialog open={!!user} onOpenChange={open => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Reiniciar la verificación en dos pasos?</AlertDialogTitle>
          <AlertDialogDescription>
            Hacelo solo si {who(user)} perdió el teléfono o la app de autenticación. Desde ahora entra solo con su
            contraseña, le avisamos por correo y puede volver a activarla desde Mi cuenta.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={resettingSecondStep}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={resettingSecondStep}
            onClick={e => {
              e.preventDefault()
              if (user) resetSecondStep(user, onClose)
            }}
          >
            {resettingSecondStep ? 'Reiniciando…' : 'Reiniciar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
