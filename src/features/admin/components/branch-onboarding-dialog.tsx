'use client'

import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Bot, Check, CheckCircle2, CreditCard, Loader2, MessageSquare, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { PrincipalCode } from '@/types/api/hierarchy'
import type { OnboardWhatsappResponse } from '@/types/api/whatsapp-onboarding'
import { useAssignPlan, useBillingOverview } from '../hooks/use-billing'
import { useNetworkUserActions, usePrincipalCodeActions } from '../hooks/use-hierarchy'
import { networkErrorMessage, restorableUserIdOf } from '../lib/network-user-errors'
import { isValidProducerCode, MIN_PASSWORD_LENGTH, PRODUCER_CODE_HINT } from '../lib/network-users'
import { ROLES } from '../lib/roles'
import { ConectarWhatsapp } from './conectar-whatsapp'
import { NumberAssistantSheet } from './number-assistant-sheet'
import { UserDataFields } from './user-data-fields'

type Step = 'code' | 'user' | 'number' | 'assistant' | 'plan' | 'done'

/** The principal the productor is created in. */
export interface OnboardingPrincipal {
  id: number
  name: string
}

const STEPS: { key: Step; label: string }[] = [
  { key: 'code', label: 'Productor' },
  { key: 'user', label: 'Usuario' },
  { key: 'number', label: 'WhatsApp' },
  { key: 'assistant', label: 'Asistente' },
  { key: 'plan', label: 'Plan' },
]

function failed(error: unknown, fallback: string) {
  toast.error(networkErrorMessage(error, fallback))
}

function Stepper({ current }: { current: Step }) {
  const index = STEPS.findIndex(s => s.key === current)
  return (
    <ol className="flex flex-wrap items-center gap-1.5 text-[11.5px]">
      {STEPS.map((step, i) => {
        const state = i < index || current === 'done' ? 'done' : i === index ? 'current' : 'todo'
        return (
          <li key={step.key} className="flex items-center gap-1.5">
            <span
              className={`flex size-5 items-center justify-center rounded-full border text-[10.5px] font-semibold ${
                state === 'done'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : state === 'current'
                    ? 'border-ember bg-ember text-on-ember'
                    : 'border-line-2 text-muted-foreground'
              }`}
            >
              {state === 'done' ? <Check className="size-3" /> : i + 1}
            </span>
            <span className={state === 'current' ? 'font-medium text-ink' : 'text-muted-foreground'}>{step.label}</span>
            {i < STEPS.length - 1 && <span className="mx-0.5 h-px w-4 bg-line-2" />}
          </li>
        )
      })}
    </ol>
  )
}

// ─── Steps ───────────────────────────────────────────────────────────────────────

function CodeStep({
  principal,
  onCreated,
}: {
  principal: OnboardingPrincipal
  onCreated: (code: PrincipalCode) => void
}) {
  const [code, setCode] = useState('')
  const [holderName, setHolderName] = useState('')
  const { createCode } = usePrincipalCodeActions()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!isValidProducerCode(code)) {
      toast.error(`El código no es válido. ${PRODUCER_CODE_HINT}`)
      return
    }
    createCode.mutate(
      {
        principalId: principal.id,
        data: { code: code.trim(), ...(holderName.trim() ? { holderName: holderName.trim() } : {}) },
      },
      { onSuccess: onCreated, onError: error => failed(error, 'No se pudo crear el productor') },
    )
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-[13px] text-muted-foreground">
        Cada productor es un código de Triunfo de {principal.name}. Su cartera, su número y su Admin quedan atados a ese
        código y separados del resto. Si el código ya existía y estaba borrado, vuelve.
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="onboarding-code">Código de productor (Triunfo)</Label>
        <Input
          id="onboarding-code"
          required
          maxLength={20}
          placeholder="14831"
          className="h-10"
          value={code}
          onChange={e => setCode(e.target.value)}
        />
        <p className="text-[12px] text-muted-foreground">{PRODUCER_CODE_HINT}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="onboarding-holder">
          Titular <span className="text-muted-foreground">(como figura en Triunfo)</span>
        </Label>
        <Input
          id="onboarding-holder"
          maxLength={120}
          placeholder="Productor Pueblo Esther"
          className="h-10"
          value={holderName}
          onChange={e => setHolderName(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={createCode.isPending || !code.trim()}>
          {createCode.isPending && <Loader2 className="size-4 animate-spin" />}
          Crear productor
        </Button>
      </div>
    </form>
  )
}

function UserStep({
  principal,
  code,
  onCreated,
}: {
  principal: OnboardingPrincipal
  code: PrincipalCode
  onCreated: (user: { email: string; invited: boolean }) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { createUser } = useNetworkUserActions()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (password && password.length < MIN_PASSWORD_LENGTH) {
      toast.error(`La contraseña necesita al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      return
    }
    createUser.mutate(
      {
        email: email.trim(),
        ...(name.trim() ? { name: name.trim() } : {}),
        ...(password ? { password } : {}),
        role: ROLES.admin,
        producerId: principal.id,
        producerCodeIds: [code.id],
      },
      {
        onSuccess: created => onCreated({ email: created.email, invited: created.invitationSent }),
        onError: error =>
          toast.error(
            restorableUserIdOf(error) !== null
              ? 'Ese correo es de un usuario eliminado: usá otro, o restauralo desde "Nuevo usuario" en Usuarios.'
              : networkErrorMessage(error, 'No se pudo crear el usuario'),
          ),
      },
    )
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-[13px] text-muted-foreground">
        El Admin de <span className="font-medium text-ink">{code.holderName ?? code.code}</span>. Solo ve los
        asegurados, chats y números del código {code.code}.
      </p>
      <UserDataFields
        idPrefix="onboarding-user"
        name={name}
        onNameChange={setName}
        email={email}
        onEmailChange={setEmail}
        password={password}
        onPasswordChange={setPassword}
        passwordMode="optional"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={createUser.isPending}>
          {createUser.isPending && <Loader2 className="size-4 animate-spin" />}
          Crear usuario
        </Button>
      </div>
    </form>
  )
}

function NumberStep({
  code,
  onConnected,
  onLater,
}: {
  code: PrincipalCode
  onConnected: (result: OnboardWhatsappResponse) => void
  onLater: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-muted-foreground">
        El número de WhatsApp del productor, facturado al código {code.code}. Antes de conectarlo, completá el nombre
        con el que se va a ver en el panel y cómo atiende el bot: su nombre, de quién se presenta como asistente, el
        alias para transferencias, las personas de la oficina y el horario. Son obligatorios: sin ellos el número saluda
        como la casa central. El número tiene que estar activo en la app WhatsApp Business del celular; Meta pide
        confirmarlo desde ahí.
      </p>
      <div className="rounded-lg border border-line-2 bg-secondary/40 p-4">
        <ConectarWhatsapp
          responsibleProducerCodeId={code.id}
          onConnected={onConnected}
          label="Conectar número de WhatsApp"
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] text-muted-foreground">
          Sin número, el productor queda creado igual: se conecta después desde Números.
        </span>
        <Button type="button" variant="outline" onClick={onLater} className="border-line-2">
          Conectar más tarde
        </Button>
      </div>
    </div>
  )
}

function AssistantStep({ numberId, onNext }: { numberId: number; onNext: () => void }) {
  const [open, setOpen] = useState(false)
  const [configured, setConfigured] = useState(false)
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-muted-foreground">
        El nombre del bot, de quién es asistente, el alias, las personas y el horario ya quedaron guardados con el
        número. Acá podés completar el resto: los feriados, el CBU, titular y banco de la cuenta, los datos que da
        (grúa, denuncias, dónde pagar) y qué coberturas ofrece. Lo que no completes toma lo de la organización.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => setOpen(true)}
          variant={configured ? 'outline' : 'default'}
          className={configured ? 'border-line-2' : ''}
        >
          <Bot className="size-4" />
          {configured ? 'Volver a editar' : 'Configurar el asistente'}
        </Button>
        {configured && (
          <span className="inline-flex items-center gap-1 text-[12.5px] text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4" /> Asistente configurado
          </span>
        )}
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={onNext}
          variant={configured ? 'default' : 'outline'}
          className={configured ? '' : 'border-line-2'}
        >
          {configured ? 'Continuar' : 'Continuar sin más cambios'}
        </Button>
      </div>
      <NumberAssistantSheet
        numberId={numberId}
        open={open}
        onOpenChange={o => {
          setOpen(o)
          if (!o) setConfigured(true)
        }}
      />
    </div>
  )
}

function PlanStep({ numberId, onDone }: { numberId: number; onDone: (planName: string | null) => void }) {
  const { data, isLoading } = useBillingOverview()
  const assign = useAssignPlan()
  const plans = (data?.plans ?? []).filter(plan => !plan.isTrial)
  const hasTrial = (data?.plans ?? []).some(plan => plan.isTrial)
  const [selected, setSelected] = useState<number | null>(null)
  const chosen = plans.find(plan => plan.id === selected) ?? null

  const save = () => {
    if (!chosen) return
    assign.mutate(
      { numberId, planId: chosen.id },
      {
        onSuccess: () => onDone(chosen.name),
        onError: error => failed(error, 'No se pudo asignar el plan'),
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-muted-foreground">
        Cuántos mensajes por mes incluye el número. Al llegar a ese límite, el asistente se pausa y te avisamos para que
        elijas si pasa al plan siguiente.
        {hasTrial &&
          ' Una cuenta nueva arranca con el plan de prueba su primer mes; si elegís un plan ahora, cuenta desde ya.'}
      </p>
      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Plan del número">
        {isLoading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        {plans.map(plan => (
          <button
            key={plan.id}
            type="button"
            role="radio"
            aria-checked={selected === plan.id}
            onClick={() => setSelected(plan.id)}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
              selected === plan.id ? 'border-ember bg-ember-soft' : 'border-line-2 hover:bg-secondary/50'
            }`}
          >
            <span>
              <span className="block text-[14px] font-medium text-ink">{plan.name}</span>
              <span className="text-[12px] text-muted-foreground">
                {plan.messages.toLocaleString('es-AR')} mensajes por mes
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => onDone(null)} className="border-line-2">
          Elegir después
        </Button>
        <Button type="button" onClick={save} disabled={!chosen || assign.isPending}>
          {assign.isPending && <Loader2 className="size-4 animate-spin" />}
          Asignar plan
        </Button>
      </div>
    </div>
  )
}

// ─── Dialog ──────────────────────────────────────────────────────────────────────

interface Summary {
  code: PrincipalCode | null
  user: { email: string; invited: boolean } | null
  number: OnboardWhatsappResponse | null
  plan: string | null
}

const EMPTY_SUMMARY: Summary = { code: null, user: null, number: null, plan: null }

/**
 * "Alta guiada de productor en <principal>": a new productor of a principal given explicitly (its code, its Admin, its
 * WhatsApp number and how the bot attends on it), one step at a time. The code goes through the single code endpoint
 * and the Admin through POST /hierarchy/users; number, assistant and plan act on the active principal, so an Owner's
 * caller makes `principal` the active one before opening it. Every step is saved as it goes, so closing early leaves
 * what was done. The last step puts the number on a plan of the catalog (or leaves it on the smallest one).
 */
export function BranchOnboardingDialog({
  principal,
  open,
  onOpenChange,
}: {
  principal: OnboardingPrincipal | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>('code')
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY)
  const [wasOpen, setWasOpen] = useState(open)

  // Starts over each time it opens (not when it closes, so the last step stays while the dialog fades out).
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setStep('code')
      setSummary(EMPTY_SUMMARY)
    }
  }

  const close = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.phoneNumbers })
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.billingAll })
    onOpenChange(false)
  }

  const titles: Record<Step, string> = {
    code: `Alta guiada de productor en ${principal?.name ?? ''}`,
    user: 'Su Admin',
    number: 'Su número de WhatsApp',
    assistant: 'Cómo atiende el bot',
    plan: 'Su plan de mensajes',
    done: 'Productor listo',
  }

  return (
    <Dialog open={open} onOpenChange={o => (o ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="font-display text-[20px]">{titles[step]}</DialogTitle>
          <DialogDescription asChild>
            <div className="pt-1">
              <Stepper current={step} />
            </div>
          </DialogDescription>
        </DialogHeader>

        {open && principal && step === 'code' && (
          <CodeStep
            principal={principal}
            onCreated={code => {
              setSummary(s => ({ ...s, code }))
              setStep('user')
            }}
          />
        )}
        {open && principal && step === 'user' && summary.code && (
          <UserStep
            principal={principal}
            code={summary.code}
            onCreated={user => {
              setSummary(s => ({ ...s, user }))
              setStep('number')
            }}
          />
        )}
        {open && step === 'number' && summary.code && (
          <NumberStep
            code={summary.code}
            onConnected={number => {
              setSummary(s => ({ ...s, number }))
              setStep('assistant')
            }}
            onLater={() => setStep('done')}
          />
        )}
        {open && step === 'assistant' && summary.number && (
          <AssistantStep numberId={summary.number.phoneNumberId} onNext={() => setStep('plan')} />
        )}
        {open && step === 'plan' && summary.number && (
          <PlanStep
            numberId={summary.number.phoneNumberId}
            onDone={plan => {
              setSummary(s => ({ ...s, plan }))
              setStep('done')
            }}
          />
        )}
        {open && step === 'done' && (
          <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2 text-[13px]">
              <li className="flex items-center gap-2 text-ink">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                Productor <span className="font-medium">
                  {summary.code?.holderName ?? summary.code?.code}
                </span> (código {summary.code?.code}) en {principal?.name}
              </li>
              <li className="flex items-center gap-2 text-ink">
                <UserPlus className="size-4 text-emerald-600 dark:text-emerald-400" />
                Admin <span className="font-medium">{summary.user?.email}</span>
                {summary.user?.invited && <span className="text-muted-foreground">(le llegó el enlace)</span>}
              </li>
              <li className="flex items-center gap-2 text-ink">
                <MessageSquare
                  className={`size-4 ${summary.number ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
                />
                {summary.number ? 'Número de WhatsApp conectado' : 'Número de WhatsApp: pendiente (Números → Conectar)'}
              </li>
              {summary.number && (
                <li className="flex items-center gap-2 text-ink">
                  <CreditCard className="size-4 text-muted-foreground" />
                  {summary.plan ? `Plan ${summary.plan}` : 'Plan: el más chico (se cambia en Facturación)'}
                </li>
              )}
            </ul>
            <p className="text-[12.5px] text-muted-foreground">
              Todo se puede ajustar después desde Usuarios, Números y Facturación.
            </p>
            <div className="flex justify-end">
              <Button type="button" onClick={close}>
                Listo
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
