'use client'

import { useState } from 'react'
import { ShieldCheck, ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useTwoFactorEnrollment } from '../hooks/use-two-factor-enrollment'
import { AUTHENTICATOR_APPS, LOST_PHONE_HELP } from '../lib/two-factor'
import { TwoFactorDisableDialog } from './two-factor-disable-dialog'
import { TwoFactorEnableDialog } from './two-factor-enable-dialog'

interface TwoFactorCardProps {
  email: string
  enabled: boolean
}

/** Mi cuenta › Verificación en dos pasos: optional for every role, turned on and off by the account itself. */
export function TwoFactorCard({ email, enabled }: TwoFactorCardProps) {
  const enrollment = useTwoFactorEnrollment()
  const [enableOpen, setEnableOpen] = useState(false)
  const [disableOpen, setDisableOpen] = useState(false)

  const openEnable = () => {
    enrollment.start()
    setEnableOpen(true)
  }

  return (
    <Card className="max-w-xl border-line-2 shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2.5">
          <CardTitle className="font-display text-[18px]">Verificación en dos pasos</CardTitle>
          {enabled ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <ShieldCheck className="size-3.5" /> Activa
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11.5px] font-medium text-muted-foreground">
              <ShieldOff className="size-3.5" /> Desactivada
            </span>
          )}
        </div>
        <CardDescription>
          {enabled
            ? 'Cada vez que entrás, además de tu contraseña, el panel te pide el código de 6 números de tu app de autenticación.'
            : 'Sumá un código de 6 números que genera una app en tu teléfono, además de tu contraseña. Es opcional y protege tu cuenta aunque alguien conozca tu contraseña.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5 text-[13px] leading-relaxed text-muted-foreground">
        <p>
          Sirve cualquier app de autenticación, por ejemplo {AUTHENTICATOR_APPS.slice(0, -1).join(', ')} o{' '}
          {AUTHENTICATOR_APPS[AUTHENTICATOR_APPS.length - 1]}.
        </p>
        <p>{LOST_PHONE_HELP}</p>
      </CardContent>
      <CardFooter>
        {enabled ? (
          <Button type="button" variant="outline" className="h-10" onClick={() => setDisableOpen(true)}>
            Desactivar
          </Button>
        ) : (
          <Button type="button" className="h-10" onClick={openEnable}>
            Activar
          </Button>
        )}
      </CardFooter>

      {/* Both stay mounted: turning 2FA on refreshes the profile while the recovery codes are still on screen. */}
      <TwoFactorEnableDialog email={email} enrollment={enrollment} open={enableOpen} onOpenChange={setEnableOpen} />
      <TwoFactorDisableDialog open={disableOpen} onOpenChange={setDisableOpen} />
    </Card>
  )
}
