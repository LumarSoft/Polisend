'use client'

import { Suspense, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  Activity,
  BanknoteX,
  Bell,
  ListTodo,
  Building2,
  ChevronRight,
  ChevronsUpDown,
  ClipboardList,
  FileText,
  FileWarning,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  MessageSquare,
  Network,
  Palette,
  Phone,
  Settings,
  ShieldCheck,
  Sparkles,
  ToggleRight,
  TrendingUp,
  UserCog,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
  CreditCard,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '../context/auth-context'
import { usePanelBrand } from '../hooks/use-panel-brand'
import { OrgMark } from './org-mark'
import { useProfile } from '../hooks/use-profile'
import { useNovedadesStats } from '../hooks/use-novedades-stats'
import { useInboxConversations } from '../hooks/use-inbox-conversations'
import { useInboxMessageSound } from '../hooks/use-inbox-message-sound'
import { useNewSolicitudesCount } from '../hooks/use-solicitudes'
import { useImprovementsUnseenCount } from '../hooks/use-improvements'
import { useNewProposalsCount } from '../hooks/use-proposals'
import { useTaskStats } from '../hooks/use-tasks'
import { useIntegrationStatus } from '../hooks/use-integration-status'
import { failingNames } from '../lib/integration-status'
import { CAMPAIGN_PAGES, campaignHref } from '../lib/campaign-pages'
import { ROLES, roleLabel } from '../lib/roles'
import { useActingPrincipal } from '../context/acting-principal-context'
import { useRole } from '../hooks/use-role'
import { useTenantQueriesEnabled } from '../hooks/use-tenant-queries'
import { AppearanceDialog } from './appearance-dialog'
import { OWNER_HIDDEN_PATHS, OWNER_NETWORK_PATHS, matchesPath } from '../lib/panel-areas'
import { SidebarUsage } from './sidebar-usage'

interface NavItem {
  label: string
  /** May carry a query (`?tab=`): the item is then active only on that tab. */
  href: string
  icon: LucideIcon
  /** Only for whoever manages the principal (SuperAdmin, or an Owner inside it). */
  manageOnly?: boolean
  /** With a `?tab=` href: the item is also active when the screen opens without a tab. */
  defaultTab?: boolean
}

/** A block of the menu that opens and closes; closed, it still shows its pending count. */
interface NavGroup {
  key: string
  label: string
  icon: LucideIcon
  items: NavItem[]
}

type NavEntry = NavItem | NavGroup

/** A labelled part of the menu: the Owner has two ("Mi red" and its acting principal), everyone else one. */
interface NavSection {
  key: string
  label: string
  entries: NavEntry[]
}

const isGroup = (entry: NavEntry): entry is NavGroup => 'items' in entry

const USERS_HREF = '/admin/usuarios'

/** The office's menu: SuperAdmin, Admin, and an Owner inside its acting principal. What it uses every day goes first. */
const PRINCIPAL_NAV: NavEntry[] = [
  { label: 'Inicio', href: '/admin', icon: LayoutDashboard },
  { label: 'Asuntos pendientes', href: '/admin/novedades', icon: Bell },
  { label: 'Whatsapp', href: '/admin/inbox', icon: MessageSquare },
  { label: 'Tareas', href: '/admin/tareas', icon: ListTodo },
  {
    key: 'cartera',
    label: 'Cartera',
    icon: ShieldCheck,
    items: [
      { label: 'Asegurados', href: '/admin/asegurados', icon: ShieldCheck },
      { label: 'Solicitudes', href: '/admin/solicitudes', icon: ClipboardList },
      { label: 'Siniestros', href: '/admin/siniestros', icon: FileWarning },
      { label: 'Cobranzas', href: '/admin/cobranzas', icon: Wallet },
      { label: 'Rechazos', href: '/admin/rechazos', icon: BanknoteX },
      // The principal's month-end numbers: never for an Admin.
      { label: 'Balance mensual', href: '/admin/balance', icon: TrendingUp, manageOnly: true },
    ],
  },
  // Each campaign has its own page.
  {
    key: 'campanas',
    label: 'Campañas',
    icon: Megaphone,
    items: CAMPAIGN_PAGES.map(page => ({ label: page.label, href: campaignHref(page), icon: page.icon })),
  },
  {
    key: 'administracion',
    label: 'Administración',
    icon: Settings,
    items: [
      // Admins see each number's messages; managing numbers stays with the SuperAdmin.
      { label: 'Números', href: '/admin/numeros', icon: Phone },
      { label: 'Usuarios', href: USERS_HREF, icon: Users, manageOnly: true },
      // Each number's plan and month, in messages.
      { label: 'Facturación', href: '/admin/facturacion', icon: CreditCard },
      { label: 'Configuración', href: '/admin/configuracion', icon: UserCog },
    ],
  },
  {
    key: 'ayuda',
    label: 'Ayuda',
    icon: LifeBuoy,
    items: [
      { label: 'Mejoras', href: '/admin/mejoras', icon: Sparkles },
      // How Triunfo, InfoAuto and the WhatsApp numbers are answering.
      { label: 'Status', href: '/admin/status', icon: Activity },
    ],
  },
]

/** The Developer's menu: the platform, never a cartera (see DEVELOPER_PATHS). */
const DEVELOPER_NAV: NavEntry[] = [
  { label: 'Organizaciones', href: '/admin/organizaciones', icon: Building2 },
  { label: 'Owners y zonas', href: '/admin/owners', icon: Network },
  { label: 'Usuarios', href: USERS_HREF, icon: Users },
  {
    key: 'facturacion',
    label: 'Facturación',
    icon: CreditCard,
    items: [
      { label: 'Tablero', href: '/admin/facturacion?tab=tablero', icon: CreditCard, defaultTab: true },
      { label: 'Liquidación', href: '/admin/facturacion?tab=liquidacion', icon: CreditCard },
      { label: 'Planes', href: '/admin/facturacion?tab=planes', icon: CreditCard },
    ],
  },
  // What each plan, and each role, can use.
  { label: 'Funciones por plan', href: '/admin/funciones', icon: ToggleRight },
  // Every organization's Meta templates, account by account.
  { label: 'Plantillas', href: '/admin/plantillas', icon: FileText },
  {
    key: 'ayuda',
    label: 'Ayuda',
    icon: LifeBuoy,
    items: [
      { label: 'Mejoras', href: '/admin/mejoras', icon: Sparkles },
      { label: 'Status', href: '/admin/status', icon: Activity },
    ],
  },
  { label: 'Mi cuenta', href: '/admin/cuenta', icon: UserRound },
]

/**
 * The Owner's network: the whole of it, whatever principal is active. Its Facturación is the network's tokens with
 * every zone, principal and productor (what "Consumo de la red" showed), and its Configuración is global.
 */
const OWNER_NETWORK_NAV: NavEntry[] = [
  { label: 'Mi red', href: '/admin/red', icon: Network },
  { label: 'Usuarios', href: USERS_HREF, icon: Users },
  {
    key: 'administracion-red',
    label: 'Administración',
    icon: Settings,
    items: [
      { label: 'Facturación', href: '/admin/facturacion', icon: CreditCard },
      { label: 'Configuración', href: '/admin/configuracion', icon: UserCog },
    ],
  },
]

/** Keeps the entries `keep` allows; a group left empty goes too. */
function filterNav(entries: NavEntry[], keep: (item: NavItem) => boolean): NavEntry[] {
  return entries.flatMap<NavEntry>(entry => {
    if (!isGroup(entry)) return keep(entry) ? [entry] : []
    const items = entry.items.filter(keep)
    return items.length ? [{ ...entry, items }] : []
  })
}

/** Which groups the user left open, per browser. */
const GROUPS_STORAGE_KEY = 'panel.sidebar.groups'
const GROUPS_EVENT = 'panel-sidebar-groups'

function subscribeGroups(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener(GROUPS_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(GROUPS_EVENT, onChange)
  }
}

function groupsSnapshot(): string {
  try {
    return localStorage.getItem(GROUPS_STORAGE_KEY) ?? '{}'
  } catch {
    return '{}'
  }
}

function parseGroups(raw: string): Record<string, boolean> {
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

function saveOpenGroups(groups: Record<string, boolean>) {
  try {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups))
  } catch {
    // Private window or blocked storage: the groups just reopen as they were.
  }
  window.dispatchEvent(new Event(GROUPS_EVENT))
}

const activeClasses =
  'data-[active=true]:bg-ember-soft data-[active=true]:text-ember-2 data-[active=true]:font-semibold ' +
  'data-[active=true]:hover:bg-ember-soft data-[active=true]:hover:text-ember-2'

/** The path of an href, without its query. */
function pathOf(href: string): string {
  return href.split('?')[0]
}

function isActive(pathname: string, href: string): boolean {
  const path = pathOf(href)
  if (path === '/admin') return pathname === '/admin'
  return pathname === path || pathname.startsWith(`${path}/`)
}

/** The `?tab=` an href points at, or null. */
function tabOf(href: string): string | null {
  return new URLSearchParams(href.split('?')[1] ?? '').get('tab')
}

/** An item with a `?tab=`: active only on its tab (reads the URL, so it renders inside Suspense). */
function TabAwareActive({
  item,
  pathname,
  children,
}: {
  item: NavItem
  pathname: string
  children: (active: boolean) => ReactNode
}) {
  const current = useSearchParams().get('tab')
  const tab = tabOf(item.href)
  return children(isActive(pathname, item.href) && (current === tab || (current === null && !!item.defaultTab)))
}

/** Whether an item is active: by path, or by path and tab for the items that point at a tab. */
function ActiveState({
  item,
  pathname,
  children,
}: {
  item: NavItem
  pathname: string
  children: (active: boolean) => ReactNode
}) {
  if (tabOf(item.href) === null) return children(isActive(pathname, item.href))
  return (
    <Suspense fallback={children(false)}>
      <TabAwareActive item={item} pathname={pathname}>
        {children}
      </TabAwareActive>
    </Suspense>
  )
}

/** Pulsing count badge (expanded): the ping ring draws the eye from any section so a pending item isn't missed. */
function CountBadge({ count, small = false }: { count: number; small?: boolean }) {
  return (
    <span className="relative ml-auto flex items-center justify-center group-data-[collapsible=icon]:hidden">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember-2 opacity-60" />
      <span
        className={`relative flex items-center justify-center rounded-full bg-ember font-semibold text-on-ember ${
          small ? 'h-4 min-w-4 px-1 text-[9.5px]' : 'h-5 min-w-5 px-1.5 text-[10.5px]'
        }`}
      >
        {count}
      </span>
    </span>
  )
}

/** A top-level entry (or every entry, when the sidebar is down to icons). */
function NavLink({ item, active, count }: { item: NavItem; active: boolean; count: number }) {
  return (
    <SidebarMenuItem className="relative">
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={item.label}
        className={`h-9 gap-2.5 rounded-lg transition-colors ${activeClasses}`}
      >
        <Link href={item.href}>
          <item.icon />
          <span>{item.label}</span>
          {count > 0 && <CountBadge count={count} />}
        </Link>
      </SidebarMenuButton>
      {count > 0 && (
        // Pulsing dot for the collapsed (icon-only) sidebar.
        <span className="pointer-events-none absolute right-1 top-1 hidden size-2 group-data-[collapsible=icon]:flex">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember-2 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-ember-2" />
        </span>
      )}
    </SidebarMenuItem>
  )
}

function NavGroupBlock({
  group,
  open,
  onToggle,
  pathname,
  alertCount,
}: {
  group: NavGroup
  open: boolean
  onToggle: () => void
  pathname: string
  alertCount: (href: string) => number
}) {
  const total = group.items.reduce((sum, item) => sum + alertCount(pathOf(item.href)), 0)
  const containsActive = group.items.some(item => isActive(pathname, item.href))
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        tooltip={group.label}
        className={`h-9 gap-2.5 rounded-lg transition-colors ${containsActive && !open ? 'text-ember-2' : ''}`}
      >
        <group.icon />
        <span>{group.label}</span>
        {/* The arrow always shows the block unfolds; closed, its pending count goes before it. */}
        <span className="ml-auto flex items-center gap-1.5">
          {!open && total > 0 && <CountBadge count={total} />}
          <ChevronRight
            aria-hidden
            className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out motion-reduce:transition-none ${open ? 'rotate-90' : ''}`}
          />
        </span>
      </SidebarMenuButton>
      {/* Always rendered so it can unfold and fold: the grid row goes from 0fr to 1fr. Closed, it is
          hidden from screen readers and out of the tab order. */}
      <div
        aria-hidden={!open}
        inert={!open}
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <SidebarMenuSub>
            {group.items.map(item => {
              const count = alertCount(pathOf(item.href))
              return (
                <SidebarMenuSubItem key={item.href}>
                  <ActiveState item={item} pathname={pathname}>
                    {active => (
                      <SidebarMenuSubButton asChild isActive={active} className={activeClasses}>
                        <Link href={item.href}>
                          <span>{item.label}</span>
                          {count > 0 && <CountBadge count={count} small />}
                        </Link>
                      </SidebarMenuSubButton>
                    )}
                  </ActiveState>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </div>
      </div>
    </SidebarMenuItem>
  )
}

/** One labelled part of the menu, its groups opening as the user left them. */
function NavSectionBlock({
  section,
  pathname,
  alertCount,
  isGroupOpen,
  toggleGroup,
}: {
  section: NavSection
  pathname: string
  alertCount: (href: string) => number
  isGroupOpen: (key: string) => boolean
  toggleGroup: (key: string) => void
}) {
  const { state, isMobile } = useSidebar()
  // Down to icons, groups can't open: every entry shows as its own icon.
  const iconsOnly = state === 'collapsed' && !isMobile
  const leaves = section.entries.flatMap(entry => (isGroup(entry) ? entry.items : [entry]))

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="truncate text-[10.5px] tracking-[0.14em] uppercase">
        {section.label}
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {iconsOnly
          ? leaves.map(item => (
              <ActiveState key={item.href} item={item} pathname={pathname}>
                {active => <NavLink item={item} active={active} count={alertCount(pathOf(item.href))} />}
              </ActiveState>
            ))
          : section.entries.map(entry =>
              isGroup(entry) ? (
                <NavGroupBlock
                  key={entry.key}
                  group={entry}
                  open={isGroupOpen(entry.key)}
                  onToggle={() => toggleGroup(entry.key)}
                  pathname={pathname}
                  alertCount={alertCount}
                />
              ) : (
                <ActiveState key={entry.href} item={entry} pathname={pathname}>
                  {active => <NavLink item={entry} active={active} count={alertCount(pathOf(entry.href))} />}
                </ActiveState>
              ),
            )}
      </SidebarMenu>
    </SidebarGroup>
  )
}

/** The menu of the role: the Developer's platform, the Owner's network plus its principal, or the office's. */
function useNavSections(): NavSection[] {
  const { isDeveloper, isOwner, canManageOrg } = useRole()
  const { hasPrincipal, group } = useActingPrincipal()
  const brand = usePanelBrand()
  if (isDeveloper) return [{ key: 'platform', label: 'Plataforma', entries: DEVELOPER_NAV }]
  const office = filterNav(PRINCIPAL_NAV, item => !item.manageOnly || canManageOrg)
  if (!isOwner) return [{ key: 'office', label: 'Navegación', entries: office }]
  return [
    { key: 'network', label: 'Mi red', entries: OWNER_NETWORK_NAV },
    {
      key: 'principal',
      // A zone's group chosen as a principal is named after itself, not after the zone's holding principal.
      label: hasPrincipal ? (group?.name ?? brand.name) : 'Sin principal elegido',
      // Usuarios, Facturación and Configuración are the network's, above; the office's day is not the Owner's.
      entries: filterNav(
        office,
        item => !matchesPath(pathOf(item.href), [...OWNER_NETWORK_PATHS, ...OWNER_HIDDEN_PATHS]),
      ),
    },
  ]
}

/** The pending counts of the menu. Only a principal's office loads them: never the Developer. */
function useAlertCounts(): (href: string) => number {
  const { isDeveloper, isOwner } = useRole()
  const tenant = useTenantQueriesEnabled()
  // An Owner has no Asuntos pendientes, Whatsapp or Solicitudes in its menu: their counts are not loaded.
  const office = tenant && !isOwner
  const { data: novedadesStats } = useNovedadesStats({}, office)
  const { data: taskStats } = useTaskStats(office)
  // "Pending" conversations = a client asked for a human agent → needs attention.
  const { data: inboxConversations } = useInboxConversations(undefined, undefined, undefined, office)
  useInboxMessageSound(inboxConversations)
  const inboxPending = inboxConversations?.filter(c => c.status === 'pending').length ?? 0
  const { data: solicitudesNuevas = 0 } = useNewSolicitudesCount(office)
  // "Mejoras" badge: unseen improvements for the office, new proposals for the Developer.
  // Not for an Owner: the "new" marks are per user and would mix its principals.
  const { data: improvementsUnseen } = useImprovementsUnseenCount(tenant && !isOwner)
  const { data: newProposals } = useNewProposalsCount(isDeveloper)
  // Status: the Developer's global view, or the office's own.
  const { data: integrationStatus } = useIntegrationStatus({ refreshMs: 5 * 60 * 1000, enabled: isDeveloper || tenant })

  return (href: string): number => {
    if (href === '/admin/novedades') return novedadesStats?.actionableTotal ?? 0
    if (href === '/admin/tareas') return taskStats?.open ?? 0
    if (href === '/admin/solicitudes') return solicitudesNuevas
    if (href === '/admin/inbox') return inboxPending
    if (href === '/admin/mejoras') return (isDeveloper ? newProposals?.count : improvementsUnseen?.count) ?? 0
    if (href === '/admin/status') return integrationStatus ? failingNames(integrationStatus).length : 0
    return 0
  }
}

/** Under the brand: where the person stands. An Owner always sees its zone and principal. */
function useHeaderCaption(): string {
  const { isDeveloper, isOwner } = useRole()
  const { hasPrincipal, zone, isLoading } = useActingPrincipal()
  if (isDeveloper) return 'Panel de la plataforma'
  if (!isOwner) return 'Panel · Polisend'
  if (isLoading) return 'Cargando tu red…'
  if (!hasPrincipal) return zone ? `${zone.name} · sin principal elegido` : 'Sin principal elegido'
  return zone ? `Zona: ${zone.name}` : 'Mi principal'
}

export function AppSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const { data: profile } = useProfile()
  const { role, isDeveloper } = useRole()
  const tenant = useTenantQueriesEnabled()
  const sections = useNavSections()
  const alertCount = useAlertCounts()
  const brand = usePanelBrand()
  const caption = useHeaderCaption()
  const [appearanceOpen, setAppearanceOpen] = useState(false)

  const initials = profile?.email.slice(0, 2).toUpperCase() ?? brand.initials
  // The SuperAdmin of a zone's groups is an Admin with groups for the API.
  const label = profile?.managedGroups?.length ? roleLabel(ROLES.superAdmin) : roleLabel(role)

  // Open groups as the user left them (per browser). The group of the page you are on opens by itself;
  // closing it lasts until you move to another page.
  const storedGroups = useSyncExternalStore(subscribeGroups, groupsSnapshot, () => '{}')
  const openGroups = useMemo(() => parseGroups(storedGroups), [storedGroups])
  const [closedOn, setClosedOn] = useState<string | null>(null)
  const activeGroup = sections
    .flatMap(section => section.entries)
    .find((entry): entry is NavGroup => isGroup(entry) && entry.items.some(item => isActive(pathname, item.href)))
  const activeKey = activeGroup?.key ?? null
  const isGroupOpen = (key: string) => (key === activeKey ? closedOn !== pathname : !!openGroups[key])
  const toggleGroup = (key: string) => {
    if (key === activeKey) {
      setClosedOn(closedOn === pathname ? null : pathname)
      return
    }
    saveOpenGroups({ ...openGroups, [key]: !openGroups[key] })
  }

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-1 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <OrgMark brand={brand} size={32} className="rounded-lg shadow-sm" />
          <div className="grid flex-1 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-display text-[13.5px] text-sidebar-foreground">{brand.name}</span>
            <span className="truncate text-[11px] text-muted-foreground">{caption}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {sections.map(section => (
          <NavSectionBlock
            key={section.key}
            section={section}
            pathname={pathname}
            alertCount={alertCount}
            isGroupOpen={isGroupOpen}
            toggleGroup={toggleGroup}
          />
        ))}
      </SidebarContent>

      <SidebarFooter>
        {/* The month of the principal's numbers; the Developer's month is the platform's, in Facturación. */}
        <SidebarUsage enabled={tenant && !isDeveloper} />
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  data-help="usuario-menu"
                  className="rounded-lg data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-ember-soft text-[12px] font-semibold text-ember-2">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-[13px] font-medium text-sidebar-foreground">
                      {profile?.email ?? 'Cargando…'}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">{label}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="end"
                sideOffset={10}
                className="w-(--radix-dropdown-menu-trigger-width) min-w-60"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="grid leading-tight">
                    <span className="truncate text-[13px] font-medium">{profile?.email}</span>
                    <span className="truncate text-[11px] text-muted-foreground">{label}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/cuenta">
                    <UserRound />
                    Mi cuenta
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem data-help="usuario-apariencia" onSelect={() => setAppearanceOpen(true)}>
                  <Palette />
                  Apariencia
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={logout}>
                  <LogOut />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        <AppearanceDialog open={appearanceOpen} onOpenChange={setAppearanceOpen} />
      </SidebarFooter>
    </Sidebar>
  )
}
