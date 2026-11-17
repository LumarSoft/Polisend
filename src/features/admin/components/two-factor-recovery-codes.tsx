'use client'

import { useState } from 'react'
import { Copy, Download, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { saveBlob } from '@/lib/download'
import { copyToClipboard } from '../lib/clipboard'
import { RECOVERY_CODES_FILE_NAME, recoveryCodesText } from '../lib/two-factor'

interface TwoFactorRecoveryCodesProps {
  email: string
  codes: string[]
  onDone: () => void
}

/** The 10 recovery codes right after turning 2FA on: the only time the panel can show them. */
export function TwoFactorRecoveryCodes({ email, codes, onDone }: TwoFactorRecoveryCodesProps) {
  const [saved, setSaved] = useState(false)
  const text = recoveryCodesText(email, codes)

  const copy = async () => {
    if (await copyToClipboard(text)) toast.success('Códigos copiados')
    else toast.error('No se pudieron copiar. Descargalos o anotalos a mano.')
  }

  const download = () => saveBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), RECOVERY_CODES_FILE_NAME)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[13px] leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
        <span>
          Es la única vez que los vas a ver. Cada código sirve una sola vez para entrar si no tenés el teléfono a mano:
          copialos o descargalos y guardalos en un lugar seguro.
        </span>
      </div>

      <ol className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-line-2 bg-canvas px-4 py-3.5 font-mono text-[14px] tracking-wider text-ink">
        {codes.map((code, index) => (
          <li key={code} className="flex items-baseline gap-2">
            <span className="w-5 text-right text-[11px] text-muted-foreground">{index + 1}.</span>
            <span>{code}</span>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => void copy()}>
          <Copy className="size-4" /> Copiar
        </Button>
        <Button type="button" variant="outline" onClick={download}>
          <Download className="size-4" /> Descargar
        </Button>
      </div>

      <label className="flex items-start gap-2.5 text-[13px] text-ink">
        <input
          type="checkbox"
          className="mt-0.5 size-4 shrink-0 accent-ember"
          checked={saved}
          onChange={e => setSaved(e.target.checked)}
        />
        Ya guardé mis códigos de recuperación.
      </label>

      <Button type="button" disabled={!saved} onClick={onDone} className="h-10">
        Listo
      </Button>
    </div>
  )
}
