'use client'

import { useState, type FormEvent } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTwoFactorActions } from '../hooks/use-two-factor'
import { anyCodeInput, isAppCode, isRecoveryCode, twoFactorErrorCode, twoFactorErrorMessage } from '../lib/two-factor'

interface TwoFactorDisableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** "Desactivar": the current password plus a code of the app or a recovery code. */
export function TwoFactorDisableDialog({ open, onOpenChange }: TwoFactorDisableDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Mounted only while open: the password and the code are forgotten when it closes. */}
        {open && <DisableForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function DisableForm({ onDone }: { onDone: () => void }) {
  const { disable } = useTwoFactorActions()
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const valid = password.length > 0 && (isAppCode(code) || isRecoveryCode(code))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid || disable.isPending) return
    setError(null)
    disable.mutate(
      { password, code },
      {
        onSuccess: () => {
          toast.success('Desactivaste la verificación en dos pasos')
          onDone()
        },
        onError: err => {
          if (twoFactorErrorCode(err) === 'TWO_FACTOR_NOT_ENABLED') {
            toast.info('La verificación en dos pasos ya estaba desactivada')
            onDone()
            return
          }
          setCode('')
          setError(twoFactorErrorMessage(err, 'No se pudo desactivar. Intentá de nuevo.'))
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="font-display text-[18px]">Desactivar la verificación en dos pasos</DialogTitle>
        <DialogDescription>
          Tu cuenta va a quedar protegida solo con la contraseña. Para confirmar que sos vos, escribí tu contraseña y un
          código de tu app (o uno de tus códigos de recuperación).
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <Label htmlFor="two-factor-disable-password">Contraseña</Label>
        <Input
          id="two-factor-disable-password"
          type="password"
          autoComplete="current-password"
          autoFocus
          className="h-10"
          value={password}
          onChange={e => {
            setPassword(e.target.value)
            setError(null)
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="two-factor-disable-code">Código de tu app o código de recuperación</Label>
        <Input
          id="two-factor-disable-code"
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="123456 o ABCDE-FGHJK"
          className="h-10 font-mono tracking-[0.15em]"
          value={code}
          onChange={e => {
            setCode(anyCodeInput(e.target.value))
            setError(null)
          }}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-3.5 py-2.5 text-[13px] text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" variant="destructive" disabled={!valid || disable.isPending}>
          {disable.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Desactivando…
            </>
          ) : (
            'Desactivar'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
