import { toast } from 'sonner'
import type { ImprovementGuide, ImprovementStep } from '@/types/api/improvements'
import { CAMPAIGN_PAGES } from './campaign-pages'
import { TOURS } from './panel-tours'
import { SCREENS, screenHref } from './panel-screens'
import { tourStore, type ActiveTour } from './tour-store'

/**
 * An improvement's announcement and step-by-step guide (api_john `Improvement.screen` / `steps`).
 *
 * Lumar writes them in Mejoras next to the improvement: the screen where it is announced (an id of
 * `SCREENS`, the same ones the assistant links to) and up to six steps. Each step rings the real element
 * by its `data-help` anchor, like the assistant's guides; without one it shows in the middle of the
 * screen. The card shows once per user on that screen (ImprovementAnnouncement) and the guide replays
 * from Mejoras (ImprovementGuidesShelf).
 */

/** Screens an improvement can be announced on, with the menu's names. */
export const GUIDE_SCREENS: { id: string; label: string }[] = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'asuntos', label: 'Asuntos pendientes' },
  { id: 'whatsapp', label: 'Whatsapp' },
  { id: 'tareas', label: 'Tareas' },
  { id: 'asegurados', label: 'Asegurados' },
  { id: 'solicitudes', label: 'Solicitudes' },
  { id: 'siniestros', label: 'Siniestros' },
  { id: 'cobranzas', label: 'Cobranzas' },
  { id: 'rechazos', label: 'Rechazos' },
  { id: 'balance', label: 'Balance mensual' },
  { id: 'campanas', label: 'Campañas' },
  ...CAMPAIGN_PAGES.map(page => ({ id: `campana-${page.slug}`, label: `Campañas › ${page.label}` })),
  { id: 'numeros', label: 'Números' },
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'facturacion', label: 'Facturación' },
  { id: 'configuracion', label: 'Configuración' },
  { id: 'mejoras', label: 'Mejoras' },
  { id: 'status', label: 'Status' },
]

export function guideScreenLabel(screen: string): string {
  return GUIDE_SCREENS.find(s => s.id === screen)?.label ?? 'el panel'
}

/** The pathname the screen lives at (its card shows there), or null for an id the panel doesn't know. */
export function guideScreenPath(screen: string): string | null {
  return SCREENS[screen]?.path ?? null
}

/**
 * The `data-help` anchors the panel already has, for the editor's suggestions: the ones the assistant's
 * guides use. A new feature adds its own on its elements (`data-help="chat-nuevo"`) and they can be typed in.
 */
export const KNOWN_ANCHORS: string[] = [
  ...new Set(
    Object.values(TOURS).flatMap(tour =>
      tour.steps.flatMap(step => [step.target, 'waitFor' in step ? step.waitFor : undefined]),
    ),
  ),
]
  .filter((anchor): anchor is string => !!anchor)
  .sort()

/** The steps as the guide runs them. */
function toTourSteps(steps: ImprovementStep[]): ActiveTour['steps'] {
  return steps.map(step => ({
    title: step.title,
    text: step.text ?? '',
    target: step.target ?? undefined,
    waitFor: step.target && step.waitForClick ? step.target : undefined,
  }))
}

type GuideSource = Pick<ImprovementGuide, 'screen' | 'steps'>

/** Whether it has a guide the panel can run: steps, and a screen this panel knows. */
export function hasGuide<T extends { screen: string | null; steps: ImprovementStep[] | null }>(
  improvement: T,
): improvement is T & GuideSource {
  return !!improvement.screen && !!guideScreenPath(improvement.screen) && (improvement.steps?.length ?? 0) > 0
}

/**
 * Runs the improvement's guide on its screen (taking the person there first). From the announcement, the end
 * says where to find it again.
 */
export function playGuide(guide: GuideSource, { fromAnnouncement = false } = {}): void {
  const route = guideScreenPath(guide.screen)
  if (!route || guide.steps.length === 0) return
  tourStore.play({
    kind: 'improvement',
    route,
    href: screenHref(guide.screen),
    heading: `Novedad en ${guideScreenLabel(guide.screen)}`,
    steps: toTourSteps(guide.steps),
    onFinish: fromAnnouncement ? () => toast.success('¡Listo! Si lo necesitás de nuevo, está en Mejoras.') : undefined,
  })
}
