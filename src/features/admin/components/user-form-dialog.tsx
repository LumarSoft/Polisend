'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { Info, Loader2, MailCheck, Send } from 'lucide-react'
import { toast } from 'sonner'
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
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { NetworkUser, NetworkUserRole } from '@/types/api/hierarchy'
import { useNetworkUserForm, type NetworkUserFormState, type SavedResult } from '../hooks/use-network-user-form'
import { ROLES, roleLabel } from '../lib/roles'
import {
  CodesPicker,
  FixedPrincipal,
  NewPrincipalFields,
  PrincipalCodesPreview,
  PrincipalModeSwitch,
  PrincipalPicker,
  RoleCards,
} from './user-access-fields'
import { AccountAccessDialog } from './account-access-dialog'
import { UserDataFields } from './user-data-fields'

interface UserFormDialogProps {
  /** Null = "Nuevo usuario". */
  user: NetworkUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The principal a new user starts in: the list's filter or `?principal=`. */
  defaultPrincipalId: number | null
  /** The role a new user starts with (Mi red's «Sin SuperAdmin · crear uno» asks for SuperAdmin); Admin by default. */
  defaultRole?: NetworkUserRole
  /** The SuperAdmin edits its principal's codes in the "Productores" tab of the same screen. */
  onEditCodes?: () => void
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-[12.5px] text-muted-foreground">
      <Info className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  )
}

/** "Principal" (SuperAdmin) or "Depende de" (Admin): which principal the account belongs to. */
function PrincipalSection({ form }: { form: NetworkUserFormState }) {
  const { fields, principal } = form
  const isAdminRole = fields.role === ROLES.admin

  if (form.principalFixed) {
    return (
      <FixedPrincipal
        principal={principal}
        note={form.isEdit ? 'El principal de un usuario no cambia' : 'Tu principal'}
      />
    )
  }

  const noPlace = form.isDeveloper && form.selectablePrincipals.length === 0
  return (
    <div className="flex flex-col gap-3">
      {form.isDeveloper && (
        <Note>
          La plataforma solo crea la primera cuenta de un principal sin usuarios, o la de un principal nuevo. Las demás
          las crean su SuperAdmin o su Owner, y siempre por invitación.
        </Note>
      )}
      {form.canCreatePrincipal && <PrincipalModeSwitch value={fields.principalMode} onChange={form.setPrincipalMode} />}
      {form.usingNewPrincipal ? (
        <NewPrincipalFields
          draft={fields.draft}
          onChange={form.setDraft}
          zones={form.zones}
          zoneRequired={form.isOwner}
        />
      ) : noPlace ? (
        <p className="rounded-lg border border-line-2 bg-secondary/40 p-3 text-[12.5px] text-muted-foreground">
          Todos los principales ya tienen usuarios o son el principal propio de un Owner.
          {isAdminRole ? ' Elegí SuperAdmin para dar de alta un principal nuevo.' : ' Creá un principal nuevo.'}
        </p>
      ) : (
        <PrincipalPicker
          principals={form.selectablePrincipals}
          value={principal?.id ?? null}
          onChange={form.setPrincipalId}
          label={isAdminRole ? 'Depende de' : 'Principal'}
        />
      )}
    </div>
  )
}

function CodesSection({ form, onEditCodes }: { form: NetworkUserFormState; onEditCodes?: () => void }) {
  const { fields, principal } = form

  if (fields.role === ROLES.superAdmin) {
    if (form.usingNewPrincipal) {
      return <PrincipalCodesPreview codes={form.newPrincipalCodes.map(code => ({ code }))} />
    }
    if (!principal) return null
    const editCodes = form.isSuperAdmin
      ? onEditCodes && { onClick: onEditCodes }
      : form.isOwner
        ? { href: '/admin/red' }
        : { href: `/admin/organizaciones/${principal.id}` }
    return (
      <PrincipalCodesPreview codes={principal.codes.filter(code => code.isActive)} editCodes={editCodes || undefined} />
    )
  }

  if (!principal) return null
  return (
    <Section title="Códigos que ve">
      <CodesPicker
        options={form.codeOptions}
        selected={form.codeIds}
        onToggle={form.toggleCode}
        onCreate={form.createCode}
        creating={form.creatingCode}
        canCreate
      />
    </Section>
  )
}

function RestoreDialog({ form }: { form: NetworkUserFormState }) {
  const { fields } = form
  return (
    <AlertDialog open={form.restoreUserId !== null} onOpenChange={open => !open && form.cancelRestore()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ese correo es de un usuario eliminado</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex flex-col gap-2">
              <span>
                Podés restaurar a <span className="font-medium text-ink">{fields.email}</span> como{' '}
                {roleLabel(fields.role)}
                {fields.role === ROLES.admin ? ', con los códigos que marcaste' : ''}. Vuelve en el principal donde
                estaba; no recupera nada de antes: ni el rol, ni los códigos, ni la verificación en dos pasos.
              </span>
              <span>
                {fields.password
                  ? 'Va a entrar con la contraseña que escribiste.'
                  : 'Le mandamos un enlace a su correo para que elija la contraseña.'}
              </span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={form.restoring}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={form.restoring}
            onClick={e => {
              e.preventDefault()
              form.restore()
            }}
          >
            {form.restoring ? 'Restaurando…' : 'Restaurar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function UserForm({
  user,
  defaultPrincipalId,
  defaultRole,
  onEditCodes,
  onDone,
}: {
  user: NetworkUser | null
  defaultPrincipalId: number | null
  defaultRole?: NetworkUserRole
  onEditCodes?: () => void
  onDone: () => void
}) {
  const saved = ({ title, description }: SavedResult) => {
    toast.success(title, description ? { description } : undefined)
    onDone()
  }
  const form = useNetworkUserForm({ user, defaultPrincipalId, defaultRole, onSaved: saved })
  const [linkOpen, setLinkOpen] = useState(false)
  const { fields } = form

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    form.submit()
  }

  if (form.optionsLoading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (form.optionsError) {
    return <p className="p-6 text-center text-[14px] text-destructive">No se pudo cargar tu red. Probá de nuevo.</p>
  }

  const passwordMode = form.isDeveloper ? 'invitation' : form.isEdit ? 'change' : 'optional'

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-5">
        <Section title="Datos">
          <UserDataFields
            idPrefix="network-user"
            name={fields.name}
            onNameChange={form.setName}
            email={fields.email}
            onEmailChange={form.setEmail}
            password={fields.password}
            onPasswordChange={form.setPassword}
            passwordMode={passwordMode}
            readOnlyIdentity={form.isEdit && form.isDeveloper}
          />
          {user && (
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" className="h-9 border-line-2" onClick={() => setLinkOpen(true)}>
                <Send className="size-4" />
                Mandar enlace para elegir contraseña
              </Button>
              <span className="text-[12px] text-muted-foreground">Le llega a su correo actual.</span>
            </div>
          )}
        </Section>

        <Section title="Rol">
          <RoleCards
            value={fields.role}
            onChange={form.setRole}
            disabledNote={form.isSelf ? 'No podés cambiar tu propio rol.' : undefined}
          />
        </Section>

        <Section title={fields.role === ROLES.admin ? 'Depende de' : 'Principal'}>
          <PrincipalSection form={form} />
        </Section>

        <CodesSection form={form} onEditCodes={onEditCodes} />

        {(form.summary || form.credentialsNote) && (
          <div className="flex flex-col gap-1.5 rounded-lg border border-ember-2/30 bg-ember-soft/50 p-3.5">
            {form.summary && <p className="text-[13.5px] font-medium text-ink">{form.summary}</p>}
            {form.credentialsNote && (
              <p className="flex items-start gap-2 text-[12.5px] text-ink-3">
                <MailCheck className="mt-0.5 size-3.5 shrink-0" />
                {form.credentialsNote}
              </p>
            )}
          </div>
        )}

        {form.errorMessage && (
          <p role="alert" className="text-[13px] text-destructive">
            {form.errorMessage}
          </p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-line-2 bg-muted/50 p-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={form.saving}>
          {form.saving && <Loader2 className="size-4 animate-spin" />}
          {form.saving ? 'Guardando…' : form.isEdit ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </div>

      <RestoreDialog form={form} />
      {user && (
        <AccountAccessDialog
          scope="network"
          action="password-setup"
          account={linkOpen ? user : null}
          onClose={() => setLinkOpen(false)}
        />
      )}
    </form>
  )
}

/** "Nuevo usuario" and "Editar usuario": the single form of plan §6.3, in one view. */
export function UserFormDialog({
  user,
  open,
  onOpenChange,
  defaultPrincipalId,
  defaultRole,
  onEditCodes,
}: UserFormDialogProps) {
  const isEdit = user !== null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[620px]">
        <DialogHeader className="border-b border-line-2 p-5">
          <DialogTitle className="font-display text-[20px]">{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `${user.name || user.email} · ${user.principal.name}`
              : 'Sus datos, su rol y qué principal y códigos va a ver.'}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <UserForm
            key={user?.id ?? 'new'}
            user={user}
            defaultPrincipalId={defaultPrincipalId}
            defaultRole={defaultRole}
            onEditCodes={
              onEditCodes &&
              (() => {
                onOpenChange(false)
                onEditCodes()
              })
            }
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
