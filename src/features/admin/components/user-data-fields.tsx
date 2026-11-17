'use client'

import { useState } from 'react'
import { Copy, Eye, EyeOff, KeyRound, Mail, MailCheck, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { generatePassword, MIN_PASSWORD_LENGTH } from '../lib/network-users'

/**
 * How the form handles the password:
 * - `optional`: a new account; empty = the person gets an invitation by mail to choose it.
 * - `change`: an existing account; empty = it keeps its password.
 * - `invitation`: the Developer, who never chooses a password: there is no field, the account is always invited.
 */
export type PasswordMode = 'optional' | 'change' | 'invitation'

interface PasswordFieldProps {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}

/** A password input with "Generar" (a random one, shown) and "Copiar", to hand it over to the person. */
export function PasswordField({ id, value, onChange, placeholder }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  const generate = () => {
    onChange(generatePassword())
    setVisible(true)
  }

  const copy = () => {
    navigator.clipboard
      .writeText(value)
      .then(() => toast.success('Contraseña copiada'))
      .catch(() => toast.error('No se pudo copiar: seleccionala y copiala a mano.'))
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          placeholder={placeholder}
          className="h-10 pl-9 pr-9"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <Button type="button" variant="outline" className="h-10 border-line-2" onClick={generate}>
        <Sparkles className="size-4" />
        Generar
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-10 border-line-2"
        onClick={copy}
        disabled={!value}
        aria-label="Copiar contraseña"
      >
        <Copy className="size-4" />
      </Button>
    </div>
  )
}

interface UserDataFieldsProps {
  idPrefix: string
  name: string
  onNameChange: (value: string) => void
  email: string
  onEmailChange: (value: string) => void
  password: string
  onPasswordChange: (value: string) => void
  passwordMode: PasswordMode
  /**
   * The Developer editing an account: name and e-mail are shown, not editable (the platform never renames or
   * re-addresses an account; the person does it in Mi cuenta, or whoever manages its principal).
   */
  readOnlyIdentity?: boolean
}

/** "Datos": name, e-mail and password of a SuperAdmin or Admin (the user form and the guided productor onboarding). */
export function UserDataFields({
  idPrefix,
  name,
  onNameChange,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  passwordMode,
  readOnlyIdentity = false,
}: UserDataFieldsProps) {
  if (readOnlyIdentity) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-line-2 bg-secondary/40 p-3.5">
        <div className="text-[14px] font-medium text-ink">{name || email}</div>
        {name && <div className="text-[12.5px] text-muted-foreground">{email}</div>}
        <p className="text-[12px] text-muted-foreground">
          La plataforma no cambia el nombre, el correo ni la contraseña de una cuenta: los cambia la persona en Mi
          cuenta, o quien administra su principal. Si no puede entrar, mandale un enlace para elegir su contraseña.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-name`}>
            Nombre <span className="text-muted-foreground">(como lo llaman en la oficina)</span>
          </Label>
          <Input
            id={`${idPrefix}-name`}
            maxLength={80}
            placeholder="Funes"
            className="h-10"
            value={name}
            onChange={e => onNameChange(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-email`}>Correo electrónico</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={`${idPrefix}-email`}
              type="email"
              required
              autoComplete="off"
              placeholder="nombre@gmail.com"
              className="h-10 pl-9"
              value={email}
              onChange={e => onEmailChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {passwordMode === 'invitation' ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-line-2 bg-secondary/40 p-3 text-[12.5px] text-muted-foreground">
          <MailCheck className="mt-0.5 size-4 shrink-0 text-ember-2" />
          <span>
            La plataforma no elige contraseñas: le llega un correo con un enlace para que elija la suya. El enlace vence
            en 72 horas y sirve una sola vez.
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-password`}>
            {passwordMode === 'change' ? 'Contraseña nueva' : 'Contraseña'}{' '}
            <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <PasswordField
            id={`${idPrefix}-password`}
            value={password}
            onChange={onPasswordChange}
            placeholder={passwordMode === 'change' ? 'Dejala vacía para no cambiarla' : 'Vacía = le mandamos un enlace'}
          />
          <p className="text-[12px] text-muted-foreground">
            {passwordMode === 'change'
              ? `Mínimo ${MIN_PASSWORD_LENGTH} caracteres. Al cambiarla se cierran sus sesiones abiertas.`
              : `Si la dejás vacía, le llega un correo para que elija la suya (vence en 72 horas). Si la escribís, mínimo ${MIN_PASSWORD_LENGTH} caracteres: pasásela vos.`}
          </p>
        </div>
      )}
    </div>
  )
}
