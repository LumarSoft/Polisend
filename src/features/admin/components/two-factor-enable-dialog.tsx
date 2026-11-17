'use client'

import { useState, type FormEvent } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { AlertCircle, Copy, Loader2, RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import type { TwoFactorSetupResponse } from '@/types/api/two-factor'
import type { TwoFactorEnrollment } from '../hooks/use-two-factor-enrollment'
import { copyToClipboard } from '../lib/clipboard'
import { AUTHENTICATOR_APPS, appCodeInput, formatSecret, isAppCode } from '../lib/two-factor'
import { TwoFactorRecoveryCodes } from './two-factor-recovery-codes'

interface TwoFactorEnableDialogProps {
  email: string
  /** Lives in the card: the dialog stays mounted (with the recovery codes) when the profile turns 2FA on. */
  enrollment: TwoFactorEnrollment
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** "Activar": scan the QR (or type the key), confirm a code, then save the recovery codes. */
export function TwoFactorEnableDialog({ email, enrollment, open, onOpenChange }: TwoFactorEnableDialogProps) {
  const showingCodes = enrollment.phase === 'codes'

  const handleOpenChange = (next: boolean) => {
    if (!next) enrollment.close()
    onOpenChange(next)
  }

  const finish = () => {
    enrollment.close()
    onOpenChange(false)
    toast.success('Activaste la verificación en dos pasos')
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-md"
        showCloseButton={!showingCodes}
        // The recovery codes are never shown again: only "Listo" closes that step.
        onEscapeKeyDown={e => showingCodes && e.preventDefault()}
        onInteractOutside={e => showingCodes && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-[18px]">
            {showingCodes ? 'Guardá tus códigos de recuperación' : 'Activar la verificación en dos pasos'}
          </DialogTitle>
          <DialogDescription>
            {showingCodes
              ? 'La verificación en dos pasos ya está activa. Desde ahora el panel te pide un código de tu app cada vez que entrás.'
              : `Usá una app de autenticación en tu teléfono: ${AUTHENTICATOR_APPS.join(', ')} u otra que lea códigos QR.`}
          </DialogDescription>
        </DialogHeader>

        {showingCodes ? (
          <TwoFactorRecoveryCodes email={email} codes={enrollment.recoveryCodes} onDone={finish} />
        ) : enrollment.alreadyEnabled ? (
          <div className="flex flex-col gap-4">
            <p className="text-[13.5px] text-ink">{enrollment.error}</p>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        ) : enrollment.secret ? (
          <ScanStep
            setup={enrollment.secret}
            error={enrollment.error}
            isConfirming={enrollment.isConfirming}
            onConfirm={enrollment.confirm}
            onClearError={enrollment.clearError}
          />
        ) : enrollment.error && !enrollment.isPreparing ? (
          <div className="flex flex-col gap-4">
            <ErrorNote message={enrollment.error} />
            <Button type="button" variant="outline" onClick={enrollment.start}>
              <RotateCw className="size-4" /> Probar de nuevo
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            <Skeleton className="size-[184px] rounded-xl" />
            <Skeleton className="h-4 w-56" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface ScanStepProps {
  setup: TwoFactorSetupResponse
  error: string | null
  isConfirming: boolean
  onConfirm: (code: string) => void
  onClearError: () => void
}

function ScanStep({ setup, error, isConfirming, onConfirm, onClearError }: ScanStepProps) {
  const [code, setCode] = useState('')
  // Only an otpauth URI becomes a link (to open the app on the same phone).
  const appLink = setup.otpauthUrl.startsWith('otpauth://') ? setup.otpauthUrl : null

  const copyKey = async () => {
    if (await copyToClipboard(setup.secret)) toast.success('Clave copiada')
    else toast.error('No se pudo copiar. Escribila a mano.')
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (isAppCode(code) && !isConfirming) onConfirm(code)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <section className="flex flex-col gap-3">
        <h3 className="text-[13.5px] font-medium text-ink">1. Escaneá este código con tu app</h3>
        <div className="flex justify-center">
          <QRCodeSVG
            value={setup.otpauthUrl}
            size={184}
            marginSize={2}
            level="M"
            title="Código QR para tu app de autenticación"
            className="rounded-xl ring-1 ring-line-2"
          />
        </div>
        {appLink && (
          <a
            href={appLink}
            className="text-center text-[12.5px] font-medium text-ember-2 underline-offset-4 hover:underline sm:hidden"
          >
            Estoy en el teléfono: abrir en mi app
          </a>
        )}
        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] text-muted-foreground">¿No podés escanearlo? Cargá esta clave a mano:</span>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded-lg border border-line-2 bg-canvas px-3 py-2 font-mono text-[13px] tracking-wider text-ink">
              {formatSecret(setup.secret)}
            </code>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Copiar clave"
              onClick={() => void copyKey()}
            >
              <Copy className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <Label htmlFor="two-factor-confirm-code" className="text-[13.5px] font-medium text-ink">
          2. Escribí el código de 6 números que muestra la app
        </Label>
        <Input
          id="two-factor-confirm-code"
          autoComplete="one-time-code"
          inputMode="numeric"
          placeholder="123456"
          className="h-10 font-mono text-[15px] tracking-[0.2em]"
          value={code}
          onChange={e => {
            setCode(appCodeInput(e.target.value))
            onClearError()
          }}
        />
      </section>

      {error && <ErrorNote message={error} />}

      <Button type="submit" disabled={!isAppCode(code) || isConfirming} className="h-10">
        {isConfirming ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Activando…
          </>
        ) : (
          'Confirmar y activar'
        )}
      </Button>
    </form>
  )
}

function ErrorNote({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-3.5 py-2.5 text-[13px] text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
