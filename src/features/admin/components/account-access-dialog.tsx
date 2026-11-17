'use client'

import { Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  accountAccessErrorMessage,
  useAccountAccess,
  type AccountAccessAction,
  type AccountAccessScope,
  type AccountAccessTarget,
} from '../hooks/use-account-access'

interface AccountAccessDialogProps {
  scope: AccountAccessScope
  action: AccountAccessAction
  /** The account; null = closed. */
  account: AccountAccessTarget | null
  onClose: () => void
}

const TITLES: Record<AccountAccessAction, string> = {
  'password-setup': 'Mandar enlace para elegir contraseña',
  'reset-two-factor': 'Reiniciar verificación en dos pasos',
}

function whoOf(account: AccountAccessTarget): string {
  return account.name?.trim() || account.email
}

/**
 * The confirmation of «Mandar enlace para elegir contraseña» and «Reiniciar verificación en dos pasos», for the rows of
 * Usuarios (`scope="network"`) and Owners y zonas (`scope="owner"`). Usage:
 *
 *   const [target, setTarget] = useState<{ action: AccountAccessAction; account: AccountAccessTarget } | null>(null)
 *   <AccountAccessDialog scope="network" action={target?.action ?? 'password-setup'} account={target?.account ?? null}
 *     onClose={() => setTarget(null)} />
 *
 * Offer «Reiniciar…» only for an account with `twoFactorEnabled` (the Developer never resets a principal's account:
 * the API answers 403 PLATFORM_CANNOT_RESET_TWO_FACTOR) and never for one's own account (that is Mi cuenta).
 */
export function AccountAccessDialog({ scope, action, account, onClose }: AccountAccessDialogProps) {
  const mutation = useAccountAccess(scope, action)

  const confirm = () => {
    if (!account) return
    mutation.mutate(account.id, {
      onSuccess: () => {
        toast.success(
          action === 'password-setup'
            ? `Enlace enviado a ${account.email}`
            : `Listo: ${whoOf(account)} entra solo con su contraseña`,
        )
        onClose()
      },
      onError: error => toast.error(accountAccessErrorMessage(error)),
    })
  }

  return (
    <AlertDialog open={account !== null} onOpenChange={open => !open && !mutation.isPending && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{TITLES[action]}</AlertDialogTitle>
          <AlertDialogDescription>
            {account &&
              (action === 'password-setup' ? (
                <>
                  Le mandamos a <span className="font-medium text-foreground">{account.email}</span> un enlace para que
                  elija una contraseña nueva. Vence en 72 horas y sirve una sola vez; hasta que la cambie, su contraseña
                  actual sigue funcionando. Si nunca usó su invitación, le llega una invitación nueva.
                </>
              ) : (
                <>
                  <span className="font-medium text-foreground">{whoOf(account)}</span> va a entrar solo con su
                  contraseña hasta que vuelva a activar la verificación desde Mi cuenta. Hacelo si perdió el teléfono y
                  no tiene sus códigos de recuperación. Le avisamos por correo.
                </>
              ))}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancelar</AlertDialogCancel>
          <Button
            variant={action === 'reset-two-factor' ? 'destructive' : 'default'}
            onClick={confirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {action === 'password-setup' ? 'Mandar enlace' : 'Reiniciar'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** «2 pasos»: the account has two-step verification on (Usuarios, Owners y zonas). */
export function TwoFactorBadge({ enabled }: { enabled: boolean | undefined }) {
  if (!enabled) return null
  return (
    <span
      title="Tiene la verificación en dos pasos activa"
      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
    >
      <ShieldCheck className="size-3" /> 2 pasos
    </span>
  )
}
