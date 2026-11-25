import { getTour, type TourId } from './panel-tours'

/** One step of an on-screen guide. */
export interface ActiveTourStep {
  /** `data-help` anchor of the element to ring; omitted = a card in the middle of the screen. */
  target?: string
  /** Improvement guides: the step's headline. */
  title?: string
  text: string
  /** The element whose tap moves on (often the target itself). */
  waitFor?: string
  /** What to say when the element is not on screen. */
  missing?: string
}

/**
 * A guide running on the real screen: one of the assistant's "Mostrame en pantalla" (panel-tours) or the
 * step-by-step of an improvement (improvement-guides).
 */
export interface ActiveTour {
  kind: 'assistant' | 'improvement'
  /** Screen (pathname) it runs on; omitted = wherever the person is. */
  route?: string
  /** Where to take the person to start it, when it is more than the route (a tab). */
  href?: string
  /** Improvement guides: what it is about ("Novedad en Whatsapp"). */
  heading?: string
  steps: ActiveTourStep[]
  /** Runs when the person ends the last step (not when they close the guide halfway). */
  onFinish?: () => void
}

/**
 * The guide running, if any. Only ever started by a tap (the assistant's button, an improvement's card or its
 * replay in Mejoras), never on its own. It lives outside React so the guide carries on while what started it
 * unmounts (the assistant in the top bar, which Whatsapp does not have; the announcement card).
 */
export interface TourState {
  tour: ActiveTour | null
  step: number
  /** Bumped on every start, so a guide run twice in a row never reuses the last run's state. */
  run: number
}

export const NO_TOUR: TourState = { tour: null, step: 0, run: 0 }

let state: TourState = NO_TOUR
const listeners = new Set<() => void>()

function set(next: Partial<TourState>) {
  state = { ...state, ...next }
  for (const listener of listeners) listener()
}

export const tourStore = {
  get: (): TourState => state,
  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  /** One of the assistant's guides. */
  start: (tourId: TourId) => tourStore.play({ kind: 'assistant', ...getTour(tourId) }),
  play: (tour: ActiveTour) => {
    if (tour.steps.length === 0) return
    set({ tour, step: 0, run: state.run + 1 })
  },
  next: () => set({ step: Math.min(state.step + 1, (state.tour?.steps.length ?? 1) - 1) }),
  /** Back one step: the person asked, or what the current step points at went away (a menu closed). */
  back: () => set({ step: Math.max(0, state.step - 1) }),
  /** `completed`: the person ended the last step, so the guide's `onFinish` runs. */
  stop: (completed = false) => {
    const finished = completed ? state.tour?.onFinish : undefined
    set({ tour: null, step: 0 })
    finished?.()
  },
}
