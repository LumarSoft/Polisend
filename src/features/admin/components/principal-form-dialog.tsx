'use client'

import { useState, type FormEvent } from 'react'
import { Loader2, Mail, Plus, X } from 'lucide-react'
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
import type { NewPrincipalCode } from '@/types/api/hierarchy'
import { CODE_HINT, isValidCode } from '../lib/producer-code'

export interface PrincipalFormValues {
  name: string
  /** Null = no zone (only where the zone is optional). */
  zoneId: number | null
  /** "" = none (only where the master code is optional). */
  masterCode: string
  codes: NewPrincipalCode[]
  /** The first SuperAdmin, invited by a mailed link; "" = none. Only with `withFirstAccount`. */
  adminEmail: string
}

interface PrincipalFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  zones: Array<{ id: number; name: string }>
  /** The Owner's principals always go in one of its zones; the platform's may go in none. */
  zoneRequired: boolean
  defaultZoneId?: number | null
  masterRequired: boolean
  /** The platform may invite the first SuperAdmin (never with a password). */
  withFirstAccount?: boolean
  saving: boolean
  submitLabel: string
  /** Saves; the caller closes the dialog and shows the result. */
  onSubmit: (values: PrincipalFormValues) => void
}

const SELECT =
  'h-9 w-full rounded-md border border-line-2 bg-paper px-2 text-[13px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-ember-ring'

/**
 * "Nuevo principal": zone, name, master code and its productores (codes with holder). The Owner creates it in one of its
 * zones without users (Mi red); the platform also uses it for "Nueva organización", with an optional zone and an
 * optional first SuperAdmin invited by mail.
 */
export function PrincipalFormDialog({ open, onOpenChange, title, description, ...form }: PrincipalFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-display text-[20px]">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {open && <PrincipalForm {...form} onCancel={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type CodeRow = { key: number; code: string; holderName: string }

function PrincipalForm({
  zones,
  zoneRequired,
  defaultZoneId = null,
  masterRequired,
  withFirstAccount = false,
  saving,
  submitLabel,
  onSubmit,
  onCancel,
}: Omit<PrincipalFormDialogProps, 'open' | 'onOpenChange' | 'title' | 'description'> & { onCancel: () => void }) {
  const [zoneId, setZoneId] = useState<number | null>(defaultZoneId ?? (zoneRequired ? (zones[0]?.id ?? null) : null))
  const [name, setName] = useState('')
  const [masterCode, setMasterCode] = useState('')
  const [rows, setRows] = useState<CodeRow[]>([])
  const [nextKey, setNextKey] = useState(1)
  const [adminEmail, setAdminEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const master = masterCode.trim()
  const filled = rows.map(row => ({ ...row, code: row.code.trim(), holderName: row.holderName.trim() }))
  const seen = new Set(master ? [master.toLowerCase()] : [])
  const rowErrors = filled.map(row => {
    if (!row.code) return row.holderName ? 'Falta el código.' : null
    if (!isValidCode(row.code)) return CODE_HINT
    const key = row.code.toLowerCase()
    if (seen.has(key)) return 'Ese código está repetido.'
    seen.add(key)
    return null
  })

  const errors = {
    zone: zoneRequired && zoneId === null ? 'Elegí la zona del principal.' : null,
    name: name.trim().length < 2 ? 'El nombre necesita al menos 2 letras.' : null,
    master: masterRequired && !master ? 'Falta el código master.' : master && !isValidCode(master) ? CODE_HINT : null,
    adminEmail:
      withFirstAccount && adminEmail.trim() && !EMAIL_PATTERN.test(adminEmail.trim()) ? 'Revisá el correo.' : null,
  }
  const invalid = Object.values(errors).some(Boolean) || rowErrors.some(Boolean)

  const updateRow = (key: number, patch: Partial<CodeRow>) =>
    setRows(prev => prev.map(row => (row.key === key ? { ...row, ...patch } : row)))
  const addRow = () => {
    setRows(prev => [...prev, { key: nextKey, code: '', holderName: '' }])
    setNextKey(nextKey + 1)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (invalid) return
    onSubmit({
      name: name.trim(),
      zoneId,
      masterCode: master,
      codes: filled
        .filter(row => row.code)
        .map(row => ({ code: row.code, ...(row.holderName ? { holderName: row.holderName } : {}) })),
      adminEmail: withFirstAccount ? adminEmail.trim() : '',
    })
  }

  const show = (message: string | null) =>
    submitted && message ? <p className="text-[12px] text-destructive">{message}</p> : null

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 py-2" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="principal-zone">Zona{zoneRequired ? '' : ' (opcional)'}</Label>
        <select
          id="principal-zone"
          value={zoneId === null ? '' : String(zoneId)}
          onChange={event => setZoneId(event.target.value ? Number(event.target.value) : null)}
          className={SELECT}
        >
          {(!zoneRequired || zoneId === null) && (
            <option value="">{zoneRequired ? 'Elegí una zona' : 'Sin zona'}</option>
          )}
          {zones.map(zone => (
            <option key={zone.id} value={zone.id}>
              {zone.name}
            </option>
          ))}
        </select>
        {show(errors.zone)}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="principal-name">Nombre del principal</Label>
          <Input
            id="principal-name"
            maxLength={120}
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="ACME Seguros SRL"
            autoFocus
          />
          {show(errors.name)}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="principal-master">Código master{masterRequired ? '' : ' (opcional)'}</Label>
          <Input
            id="principal-master"
            maxLength={20}
            value={masterCode}
            onChange={event => setMasterCode(event.target.value)}
            placeholder="11425"
            className="font-mono"
          />
          {show(errors.master)}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label>Productores (opcional)</Label>
          <Button type="button" variant="ghost" size="sm" className="h-7 text-[12px]" onClick={addRow}>
            <Plus className="size-3.5" /> Agregar código
          </Button>
        </div>
        {rows.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">
            Cada productor es un código de Triunfo con su titular.{master ? ' El código master ya queda cargado.' : ''}{' '}
            Podés sumar más ahora o después, desde los códigos del principal.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map((row, index) => (
              <div key={row.key} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Input
                    aria-label={`Código ${index + 1}`}
                    maxLength={20}
                    value={row.code}
                    onChange={event => updateRow(row.key, { code: event.target.value })}
                    placeholder="14831"
                    className="h-9 w-32 font-mono"
                  />
                  <Input
                    aria-label={`Titular del código ${index + 1}`}
                    maxLength={120}
                    value={row.holderName}
                    onChange={event => updateRow(row.key, { holderName: event.target.value })}
                    placeholder="Titular (opcional)"
                    className="h-9 flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 shrink-0 text-muted-foreground"
                    onClick={() => setRows(prev => prev.filter(r => r.key !== row.key))}
                    aria-label={`Quitar el código ${index + 1}`}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                {show(rowErrors[index])}
              </div>
            ))}
          </div>
        )}
      </div>

      {withFirstAccount && (
        <div className="flex flex-col gap-2 rounded-lg border border-line-2 bg-secondary/40 p-3">
          <Label htmlFor="principal-admin-email">Primer SuperAdmin (opcional)</Label>
          <Input
            id="principal-admin-email"
            type="email"
            value={adminEmail}
            onChange={event => setAdminEmail(event.target.value)}
            placeholder="persona@empresa.com"
          />
          {show(errors.adminEmail)}
          <p className="flex items-start gap-1.5 text-[12px] text-muted-foreground">
            <Mail className="mt-0.5 size-3.5 shrink-0" />
            Le llega una invitación a ese correo para que elija su contraseña (vence en 72 horas). Vos no elegís ni ves
            ninguna contraseña. Sin correo, el principal queda sin usuarios.
          </p>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}
