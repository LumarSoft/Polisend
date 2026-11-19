'use client'

import { Suspense, useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AssistantProvider } from '../context/assistant-context'
import { useActingPrincipal } from '../context/acting-principal-context'
import { useAuth } from '../context/auth-context'
import { useRole } from '../hooks/use-role'
import { useTenantQueriesEnabled } from '../hooks/use-tenant-queries'
import {
  DEVELOPER_PATHS,
  OWNER_HIDDEN_PATHS,
  OWNER_NETWORK_PATHS,
  SCREENS_WITH_NETWORK_FILTER,
  matchesPath,
} from '../lib/panel-areas'
import { CAMPAIGN_PAGES, campaignHref } from '../lib/campaign-pages'
import { AppSidebar } from './app-sidebar'
import { AssistantFab, AssistantLauncher } from './assistant-launcher'
import { TourOverlay } from './tour-overlay'
import { RequirePrincipal } from './require-principal'
import { TriunfoStatusBanner } from './triunfo-status-banner'
import { SectionFocus } from './section-focus'
import { SupportBanner } from './support-banner'

const TITLES: Record<string, string> = {
  '/admin': 'Inicio',
  '/admin/balance': 'Balance mensual',
  '/admin/novedades': 'Asuntos pendientes',
  '/admin/tareas': 'Tareas',
  '/admin/solicitudes': 'Solicitudes de cotización',
  '/admin/inbox': 'Whatsapp',
  '/admin/usuarios': 'Usuarios',
  '/admin/numeros': 'Números',
  '/admin/facturacion': 'Facturación',
  '/admin/funciones': 'Funciones por plan',
  '/admin/plantillas': 'Plantillas',
  '/admin/organizaciones': 'Organizaciones',
  '/admin/configuracion': 'Configuración',
  '/admin/mejoras': 'Mejoras',
  '/admin/status': 'Status',
  '/admin/owners': 'Owners y zonas',
  '/admin/red': 'Mi red',
  '/admin/red/consumo': 'Consumo de la red',
  '/admin/cuenta': 'Mi cuenta',
  ...Object.fromEntries(CAMPAIGN_PAGES.map(page => [campaignHref(page), page.label])),
}

function ShellLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-sidebar">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  )
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, hydrated } = useAuth()
  const { role, isDeveloper, isOwner, isLoading: roleLoading } = useRole()
  const { hasPrincipal, zone } = useActingPrincipal()
  const tenant = useTenantQueriesEnabled()
  // A pasted cartera URL: the Developer never enters one.
  const developerOutside = isDeveloper && !matchesPath(pathname, DEVELOPER_PATHS)
  // A pasted URL of a screen the Owner does not use goes back to Inicio.
  const ownerOutside = isOwner && matchesPath(pathname, OWNER_HIDDEN_PATHS)

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace('/admin/login')
  }, [hydrated, isAuthenticated, router])

  useEffect(() => {
    if (developerOutside) router.replace('/admin/organizaciones')
  }, [developerOutside, router])

  useEffect(() => {
    if (ownerOutside) router.replace('/admin')
  }, [ownerOutside, router])

  // Nothing renders (nothing loads) until the role is known, nor a screen the Developer is being taken out of.
  if (!hydrated || !isAuthenticated || (roleLoading && !role) || developerOutside || ownerOutside) {
    return <ShellLoading />
  }

  const title =
    TITLES[pathname] ?? (pathname.startsWith('/admin/organizaciones/') ? 'Organización' : undefined) ?? 'Panel'
  // The Whatsapp section fills the whole screen, like WhatsApp Web, and carries
  // the menu button in its own header.
  const fullScreen = pathname === '/admin/inbox'
  // An Owner whose zone change left it without a principal: a work screen that does not show the cascading filter
  // itself shows RequirePrincipal's message (with the filter) instead of loading anything.
  // Inicio with a zone and «Todos»: the whole zone added up (DashboardHome), not a request to choose a principal.
  const zoneHome = pathname === '/admin' && typeof zone?.key === 'number'
  const guardPrincipal =
    isOwner &&
    !hasPrincipal &&
    !zoneHome &&
    !matchesPath(pathname, OWNER_NETWORK_PATHS) &&
    !matchesPath(pathname, SCREENS_WITH_NETWORK_FILTER)

  return (
    <TooltipProvider delayDuration={200}>
      {/* The assistant works on a principal's cartera: never for the Developer, and for an Owner only inside one. */}
      <AssistantProvider enabled={tenant} route={pathname} screen={title}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            {/* An Owner giving support sees, over every screen, whose panel it is in and how to leave. */}
            {fullScreen ? (
              <SupportBanner />
            ) : (
              <div className="sticky top-0 z-10 shrink-0 overflow-hidden rounded-t-xl">
                <SupportBanner />
                <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-background/85 px-4 backdrop-blur-md">
                  <SidebarTrigger className="-ml-1 text-muted-foreground" />
                  <Separator orientation="vertical" className="mr-1 !h-4" />
                  <span className="font-display text-[14.5px] tracking-[-0.01em] text-ink">{title}</span>
                  <AssistantLauncher />
                </header>
              </div>
            )}
            {/* The Developer sees each organization's outage in Organizaciones instead. */}
            <TriunfoStatusBanner enabled={tenant} />
            <div className="flex flex-1 flex-col">
              {guardPrincipal ? <RequirePrincipal>{children}</RequirePrincipal> : children}
            </div>
          </SidebarInset>
          {/* Outside the top bar: the guide carries on in Whatsapp, which has none. */}
          <TourOverlay />
          {/* Whatsapp has its own button and its box to write in sits there. */}
          <AssistantFab hidden={fullScreen} />
          {/* ?seccion= of a link: the exact section lights up once it shows. */}
          <Suspense fallback={null}>
            <SectionFocus />
          </Suspense>
        </SidebarProvider>
      </AssistantProvider>
    </TooltipProvider>
  )
}
