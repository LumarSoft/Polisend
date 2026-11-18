'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Bot, Clock, ImageIcon, Loader2, PlugZap, ShieldCheck, Smartphone, Tags, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProfile } from '../hooks/use-profile'
import { useProducerConfig } from '../hooks/use-producer-config'
import { useUpdateProducerConfig } from '../hooks/use-update-producer-config'
import { useRole } from '../hooks/use-role'
import { useOwnLogo } from '../hooks/use-organization-logo'
import { usePanelBrand } from '../hooks/use-panel-brand'
import { useHomeProfile } from '../hooks/use-profile'
import { useShowHiddenCodes } from '../hooks/use-hidden-codes'
import { useActingPrincipal } from '../context/acting-principal-context'
import { brandOf } from '../lib/org-brand'
import { LogoUploader } from './logo-uploader'
import { BotProfileSection } from './bot-profile-section'
import { PricingPlansSection } from './pricing-plans-section'
import { BusinessHoursSection } from './business-hours-section'
import { CoverageSettingsSection } from './coverage-settings-section'
import { MotoCoverageSettingsSection } from './moto-coverage-settings-section'
import { SuperAdminOnlyNote } from './super-admin-only-note'
import { MyAccountSection } from './my-account-section'
import { OwnNumberSettings } from './own-number-settings'
import { TriunfoSettingsSection } from './triunfo-settings-section'
import { TriunfoWsSection } from './triunfo-ws-section'
import { TriunfoCodeCredentialsSection } from './triunfo-code-credentials-section'
import { splitNames } from '../lib/number-assistant-form'
import { useUrlTab } from '../hooks/use-panel-link'
import { useTenantQueriesEnabled } from '../hooks/use-tenant-queries'

/** "Mili, Milagros" → ["Mili", "Milagros"]. */
/** How the bot names the organization: its name and an optional short name ("Seguros del Litoral (SDL)"). */
interface OrgNaming {
  name: string
  shortName: string | null
}

/** Reminds the SuperAdmin that this is the whole organization's; each number's own assistant is in Números. */
function OwnNumberHint() {
  return (
    <div className="flex max-w-xl gap-3 rounded-xl border border-ember-ring bg-ember-soft px-4 py-3 text-[13px] text-ink-3">
      <Smartphone className="mt-0.5 size-4 shrink-0 text-ember-2" />
      <p>
        Esto vale para los números que no tienen lo suyo. El bot se enciende y se apaga en cada número, y cada número
        tiene sus feriados y pausas; también se le puede dar su propio nombre, personas, horario y datos. Todo eso está
        en{' '}
        <Link href="/admin/numeros" className="font-medium text-ember-2 underline-offset-2 hover:underline">
          Números → Asistente
        </Link>
        .
      </p>
    </div>
  )
}

/**
 * Tells a branch's admin that this tab is the whole organization's, read only,
 * and where their own number's version is (Configuración → Asistente).
 */
function OrganizationOnlyHint({ what }: { what: string }) {
  return (
    <div className="flex max-w-xl gap-3 rounded-xl border border-ember-ring bg-ember-soft px-4 py-3 text-[13px] text-ink-3">
      <Smartphone className="mt-0.5 size-4 shrink-0 text-ember-2" />
      <p>
        Esto es de toda la organización y solo un SuperAdmin lo cambia. {what} se cambia en{' '}
        <Link
          href="/admin/configuracion?tab=asistente"
          className="font-medium text-ember-2 underline-offset-2 hover:underline"
        >
          Configuración → Asistente
        </Link>
        .
      </p>
    </div>
  )
}

function BotConfigForm({
  initialName,
  initialStaff,
  org,
  canEdit,
}: {
  initialName: string
  initialStaff: string[]
  org: OrgNaming
  canEdit: boolean
}) {
  const updateConfig = useUpdateProducerConfig()
  const [botName, setBotName] = useState(initialName)
  const [staff, setStaff] = useState(initialStaff.join(', '))

  const nameChanged = botName.trim() !== initialName.trim()
  const staffChanged = splitNames(staff).join(',') !== initialStaff.join(',')
  const hasChanges = nameChanged || staffChanged

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!hasChanges) return

    updateConfig.mutate(
      {
        ...(nameChanged ? { botName: botName.trim() } : {}),
        ...(staffChanged ? { staffNames: splitNames(staff) } : {}),
      },
      {
        onSuccess: () => toast.success('Asistente actualizado'),
        onError: () => toast.error('No se pudo guardar. Intentá de nuevo.'),
      },
    )
  }

  const preview = botName.trim()
    ? `Soy ${botName.trim()}, el asistente de ${org.name}`
    : `Soy el asistente de ${org.name}${org.shortName ? ` (${org.shortName})` : ''}`

  return (
    <Card data-help="config-bot" className="max-w-xl border-line-2 shadow-sm">
      <form onSubmit={handleSubmit} className="contents">
        <CardHeader>
          <CardTitle className="font-display text-[18px]">Asistente de WhatsApp</CardTitle>
          <CardDescription>
            Elegí el nombre con el que el bot se presenta. Si lo dejás vacío, se presenta como “el asistente de{' '}
            {org.shortName ?? org.name}”. Vale para todos los números que no tengan uno propio (Números → Asistente).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <fieldset disabled={!canEdit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="bot-name">Nombre del asistente</Label>
              <div className="relative">
                <Bot className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="bot-name"
                  type="text"
                  maxLength={60}
                  placeholder="Ej: NICO (dejá vacío para no usar nombre)"
                  className="h-10 pl-9"
                  value={botName}
                  onChange={e => setBotName(e.target.value)}
                />
              </div>
              <p className="text-[12.5px] text-muted-foreground">
                Vista previa: <span className="text-ink">{preview}</span>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="staff-names">Personas de la oficina</Label>
              <Input
                id="staff-names"
                type="text"
                maxLength={200}
                placeholder="Ej: Mili, Milagros"
                className="h-10"
                value={staff}
                onChange={e => setStaff(e.target.value)}
              />
              <p className="text-[12.5px] text-muted-foreground">
                Separados por coma. Si un cliente le escribe a alguien por su nombre (“Hola Mili”), el bot le avisa a
                esa persona en Asuntos pendientes y sigue atendiendo al cliente.
              </p>
            </div>
          </fieldset>
        </CardContent>
        <CardFooter>
          {canEdit ? (
            <Button type="submit" disabled={!hasChanges || updateConfig.isPending} className="h-10">
              {updateConfig.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Guardando…
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          ) : (
            <SuperAdminOnlyNote />
          )}
        </CardFooter>
      </form>
    </Card>
  )
}

const TABS = [
  { value: 'cuenta', label: 'Cuenta', icon: UserRound },
  { value: 'asistente', label: 'Asistente', icon: Bot },
  { value: 'marca', label: 'Logo', icon: ImageIcon },
  { value: 'horarios', label: 'Horarios', icon: Clock },
  { value: 'precios', label: 'Precios', icon: Tags },
  { value: 'coberturas', label: 'Coberturas', icon: ShieldCheck },
  { value: 'triunfo', label: 'Triunfo', icon: PlugZap },
] as const

const TAB_VALUES = TABS.map(tab => tab.value)

/** The Owner's Configuración is global (18/11/2026): what is each principal's stays with its SuperAdmins. */
const OWNER_TABS = TABS.filter(tab => tab.value === 'cuenta' || tab.value === 'marca' || tab.value === 'triunfo')
const OWNER_TAB_VALUES = OWNER_TABS.map(tab => tab.value)

/** Whether the panel lists inactive and Triunfo-blocked codes (Mi red, Usuarios › Productores, the filters). */
function HiddenCodesCard() {
  const [show, setShow] = useShowHiddenCodes()
  return (
    <Card className="max-w-xl border-line-2 shadow-sm">
      <CardHeader>
        <CardTitle className="font-display text-[18px]">Códigos de productor</CardTitle>
        <CardDescription>
          Los códigos inactivos y los que Triunfo bloqueó (no admiten pólizas nuevas, renovaciones ni endosos) no se
          muestran en Mi red, en Usuarios ni en los filtros. Se recuerda en este navegador.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <label className="flex items-center gap-2.5 text-[14px] text-ink">
          <input
            type="checkbox"
            checked={show}
            onChange={event => setShow(event.target.checked)}
            className="size-4 accent-ember"
          />
          Mostrar códigos inactivos y bloqueados
        </label>
      </CardContent>
    </Card>
  )
}

/** An Owner's own logo: its own principal's, whatever principal it is working in. */
function OwnerLogoCard() {
  const { homePrincipalId } = useActingPrincipal()
  const { data: home } = useHomeProfile(homePrincipalId)
  const { upload, remove } = useOwnLogo(homePrincipalId ?? undefined)
  return (
    <Card className="max-w-xl border-line-2 shadow-sm">
      <CardHeader>
        <CardTitle className="font-display text-[18px]">Tu logo</CardTitle>
        <CardDescription>
          El de tu organización{home?.organization ? ` (${home.organization.displayName})` : ''}: se ve en el panel y en
          la credencial que se imprime para sus asegurados. PNG, JPG o WebP de hasta 2 MB; se guarda en un cuadrado. El
          logo de cada principal lo carga su SuperAdmin.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {home ? (
          <LogoUploader brand={brandOf(home.organization, home.role)} upload={upload} remove={remove} canEdit />
        ) : (
          <Skeleton className="h-24 w-full" />
        )}
      </CardContent>
    </Card>
  )
}

/** The Owner's Configuración: its account, its logo and the web-service user of its zones. No principal involved. */
function OwnerSettingsView() {
  const [tab, setTab] = useUrlTab(OWNER_TAB_VALUES, 'cuenta')
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 md:px-8 md:py-10">
      <div className="mb-7">
        <div className="text-[10.5px] font-medium uppercase tracking-[0.3em] text-ember-2">Configuración</div>
        <h1 className="mt-2 font-display text-[clamp(26px,3.5vw,36px)] tracking-[-0.035em] text-ink">Configuración</h1>
        <p className="mt-1.5 max-w-2xl text-[14px] text-muted-foreground">
          Tu cuenta, tu logo y el usuario web service de tus zonas. El asistente, los horarios, los precios, las
          coberturas y el acceso a Triunfo de cada principal los configura su SuperAdmin.
        </p>
      </div>

      <Tabs value={tab} onValueChange={value => setTab(value as (typeof OWNER_TAB_VALUES)[number])}>
        <TabsList variant="line" className="h-auto max-w-full flex-wrap justify-start gap-1">
          {OWNER_TABS.map(item => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              data-help={`config-${item.value}`}
              className="gap-1.5 px-3 py-1.5 text-[13.5px]"
            >
              <item.icon className="size-4" />
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="cuenta" className="mt-6 space-y-5">
          <MyAccountSection />
          <HiddenCodesCard />
        </TabsContent>

        <TabsContent value="marca" className="mt-6">
          <OwnerLogoCard />
        </TabsContent>

        <TabsContent value="triunfo" className="mt-6">
          <TriunfoWsSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/** The organization's logo: the panel's sidebar and the printable policy card. Only the SuperAdmin changes it. */
function LogoCard({ canEdit }: { canEdit: boolean }) {
  const brand = usePanelBrand()
  const { upload, remove } = useOwnLogo()
  return (
    <Card className="max-w-xl border-line-2 shadow-sm">
      <CardHeader>
        <CardTitle className="font-display text-[18px]">Logo de la organización</CardTitle>
        <CardDescription>
          Se ve en el panel y en la credencial que se imprime para los asegurados. PNG, JPG o WebP de hasta 2 MB; se
          guarda en un cuadrado. Sin logo se muestran las iniciales.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <LogoUploader brand={brand} upload={upload} remove={remove} canEdit={canEdit} />
        {!canEdit && <SuperAdminOnlyNote />}
      </CardContent>
    </Card>
  )
}

function FormSkeleton() {
  return (
    <Card className="max-w-xl border-line-2">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  )
}

export function SettingsView() {
  const { isOwner } = useRole()
  return isOwner ? <OwnerSettingsView /> : <PrincipalSettingsView />
}

/** A principal's Configuración: SuperAdmin and Admin. */
function PrincipalSettingsView() {
  const { data: profile } = useProfile()
  const tenantEnabled = useTenantQueriesEnabled()
  const { data: config } = useProducerConfig(tenantEnabled)
  const { canManageOrg, isAdmin } = useRole()
  // Only the SuperAdmin changes what applies to every number; a branch's admin changes their own number's
  // (from 28/10 to 10/11 any admin could, and branches saved their own data as the whole organization's).
  const canEditOrg = canManageOrg
  const [tab, setTab] = useUrlTab(TAB_VALUES, 'cuenta')

  const organizationAssistant = config ? (
    <div className="space-y-5">
      {canManageOrg && <OwnNumberHint />}
      <BotConfigForm
        key={`${config.botName ?? ''}|${(config.staffNames ?? []).join(',')}`}
        initialName={config.botName ?? ''}
        initialStaff={config.staffNames ?? []}
        org={{
          name: profile?.organization?.displayName ?? 'tu productora',
          shortName: profile?.organization?.shortName ?? null,
        }}
        canEdit={canEditOrg}
      />
      <BotProfileSection canEdit={canEditOrg} />
    </div>
  ) : (
    <FormSkeleton />
  )

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 md:px-8 md:py-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10.5px] font-medium uppercase tracking-[0.3em] text-ember-2">Configuración</div>
          <h1 className="mt-2 font-display text-[clamp(26px,3.5vw,36px)] tracking-[-0.035em] text-ink">
            Configuración
          </h1>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            Gestioná tu cuenta, el asistente de WhatsApp, los horarios de atención y los precios.
          </p>
        </div>
      </div>

      <>
        <Tabs value={tab} onValueChange={value => setTab(value as (typeof TAB_VALUES)[number])}>
          <TabsList variant="line" className="h-auto max-w-full flex-wrap justify-start gap-1">
            {TABS.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                data-help={`config-${tab.value}`}
                className="gap-1.5 px-3 py-1.5 text-[13.5px]"
              >
                <tab.icon className="size-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="cuenta" className="mt-6 space-y-5">
            <MyAccountSection />
            {canManageOrg && <HiddenCodesCard />}
          </TabsContent>

          <TabsContent value="asistente" className="mt-6">
            {isAdmin ? <OwnNumberSettings fallback={organizationAssistant} /> : organizationAssistant}
          </TabsContent>

          <TabsContent value="marca" className="mt-6">
            <LogoCard canEdit={canManageOrg} />
          </TabsContent>

          <TabsContent value="horarios" className="mt-6 space-y-5">
            {isAdmin && <OrganizationOnlyHint what="El horario y los feriados de tu número" />}
            <BusinessHoursSection canEdit={canEditOrg} />
          </TabsContent>

          <TabsContent value="coberturas" className="mt-6 space-y-5">
            {isAdmin && <OrganizationOnlyHint what="Qué coberturas ofrece tu número, cuál recomienda y en qué orden" />}
            <CoverageSettingsSection canEdit={canEditOrg} />
            <MotoCoverageSettingsSection canEdit={canEditOrg} />
          </TabsContent>

          <TabsContent value="precios" className="mt-6">
            <PricingPlansSection canEdit={canEditOrg} />
          </TabsContent>

          <TabsContent value="triunfo" className="mt-6 space-y-5">
            <TriunfoSettingsSection canEdit={canEditOrg} />
            <TriunfoCodeCredentialsSection manager={canManageOrg} />
          </TabsContent>
        </Tabs>
      </>
    </div>
  )
}
