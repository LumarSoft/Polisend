'use client'

import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
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
import type { CreateZoneRequest, Zone } from '@/types/api/hierarchy'
import { CODE_HINT, isValidCode } from '../lib/producer-code'

interface ZoneFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The zone to rename, or null for a new one. */
  zone: Zone | null
  /** What a new zone means for whoever creates it (an Owner's is its own; the platform's has no Owner yet). */
  description: string
  saving: boolean
  /** Saves and closes on success; the caller shows its errors. */
  onSave: (data: CreateZoneRequest) => void
}

/** New zone or rename one: name and, optionally, its Triunfo code (informational for now). */
export function ZoneFormDialog({ open, onOpenChange, zone, description, saving, onSave }: ZoneFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="font-display text-[20px]">{zone ? 'Editar zona' : 'Nueva zona'}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {open && <ZoneForm zone={zone} saving={saving} onSave={onSave} onCancel={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function ZoneForm({
  zone,
  saving,
  onSave,
  onCancel,
}: {
  zone: Zone | null
  saving: boolean
  onSave: (data: CreateZoneRequest) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(zone?.name ?? '')
  const [code, setCode] = useState(zone?.code ?? '')
  const trimmedCode = code.trim()
  const codeError = trimmedCode && !isValidCode(trimmedCode) ? CODE_HINT : null
  const nameError = name.trim().length > 0 && name.trim().length < 2 ? 'El nombre necesita al menos 2 letras.' : null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (codeError || name.trim().length < 2) return
    onSave({ name: name.trim(), code: trimmedCode || null })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 py-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="zone-name">Nombre</Label>
        <Input
          id="zone-name"
          required
          maxLength={120}
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder="Rosario"
          autoFocus
        />
        {nameError && <p className="text-[12px] text-destructive">{nameError}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="zone-code">Código de Triunfo (opcional)</Label>
        <Input
          id="zone-code"
          maxLength={20}
          value={code}
          onChange={event => setCode(event.target.value)}
          placeholder="R-1"
          className="font-mono"
        />
        <p className={`text-[12px] ${codeError ? 'text-destructive' : 'text-muted-foreground'}`}>
          {codeError ?? 'Si la zona tiene un código en Triunfo. Por ahora es solo informativo.'}
        </p>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {zone ? 'Guardar' : 'Crear zona'}
        </Button>
      </DialogFooter>
    </form>
  )
}
