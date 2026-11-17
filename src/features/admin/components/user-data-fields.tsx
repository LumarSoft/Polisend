'use client'

import { useState } from 'react'
import { Copy, Eye, EyeOff, KeyRound, Mail, MailCheck, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { generatePassword, MIN_PASSWORD_LENGTH } from '../lib/network-users'
import { copyToClipboard } from '../lib/clipboard'

/**
 * How the form handles the password:
 * - `optional`: a new account; empty = the person gets an invitation by mail to choose it.
 * - `change`: an existing account; empty = it keeps its password.
 * - `invitation`: the Developer creating an account. It never chooses a password: no field, the account is invited.
 * - `link`: the Developer editing an account. No field either: the person chooses it with a mailed link.
 */
export type PasswordMode = 'optional' | 'change' | 'invitation' | 'link'

/** Why the Developer never gets a password field (decision of 17/11). */
const NO_PASSWORD_REASON = 'Polisend nunca elige ni ve contraseñas; la persona la elige con el enlace.'

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

  const copy = async () => {
    if (await copyToClipboard(value)) toast.success('Contraseña copiada')
    else toast.error('No se pudo copiar: seleccionala y copiala a mano.')
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
   * The Developer editing an account: the e-mail is shown, not editable. With a reset link to an address of its own
   * the platform could log in as the person; the person changes it in Mi cuenta, or whoever manages its principal.
   */
  emailReadOnly?: boolean
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
  emailReadOnly = false,
}: UserDataFieldsProps) {
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
              required={!emailReadOnly}
              readOnly={emailReadOnly}
              aria-describedby={emailReadOnly ? `${idPrefix}-email-note` : undefined}
              autoComplete="off"
              placeholder="nombre@gmail.com"
              className={emailReadOnly ? 'h-10 bg-secondary/40 pl-9 text-muted-foreground' : 'h-10 pl-9'}
              value={email}
              onChange={e => onEmailChange(e.target.value)}
            />
          </div>
          {emailReadOnly && (
            <p id={`${idPrefix}-email-note`} className="text-[12px] text-muted-foreground">
              Polisend no cambia el correo de una cuenta: lo cambia la persona en Mi cuenta, o quien administra su
              principal.
            </p>
          )}
        </div>
      </div>

      {passwordMode === 'invitation' || passwordMode === 'link' ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-line-2 bg-secondary/40 p-3 text-[12.5px] text-muted-foreground">
          <MailCheck className="mt-0.5 size-4 shrink-0 text-ember-2" />
          <span>
            {NO_PASSWORD_REASON}{' '}
            {passwordMode === 'invitation'
              ? 'Le llega un correo con un enlace para elegir la suya: vence en 72 horas y sirve una sola vez.'
              : 'Si no puede entrar, mandale un enlace para elegir una contraseña nueva.'}
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
              : `Si la escribís, mínimo ${MIN_PASSWORD_LENGTH} caracteres: pasásela vos.`}
          </p>
        </div>
      )}
    </div>
  )
}
