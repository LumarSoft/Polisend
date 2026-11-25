'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MAX_GUIDE_STEPS, type ImprovementStep } from '@/types/api/improvements'
import { GUIDE_SCREENS, KNOWN_ANCHORS, guideScreenLabel } from '../lib/improvement-guides'
import { AnnouncementCard } from './improvement-announcement'
import { GuideCard } from './guide-card'

const fieldClass =
  'w-full rounded-xl border border-line-2 bg-paper px-3.5 py-2.5 text-[13.5px] text-ink outline-none transition-[border-color,box-shadow] focus:border-ember focus:shadow-[0_0_0_3px_var(--color-ember-soft)]'

const iconButton =
  'grid size-7 shrink-0 place-items-center rounded-lg text-faint transition-colors hover:bg-secondary hover:text-ink disabled:pointer-events-none disabled:opacity-40'

export const EMPTY_STEP: ImprovementStep = { title: '', text: null, target: null, waitForClick: false }

interface GuideFieldsProps {
  screen: string | null
  steps: ImprovementStep[]
  onScreenChange: (screen: string | null) => void
  onStepsChange: (steps: ImprovementStep[]) => void
}

/** "Aviso y paso a paso" in the improvement's form: the screen it is announced on and its steps. */
export function ImprovementGuideFields({ screen, steps, onScreenChange, onStepsChange }: GuideFieldsProps) {
  const setStep = (index: number, patch: Partial<ImprovementStep>) =>
    onStepsChange(steps.map((step, i) => (i === index ? { ...step, ...patch } : step)))
  const move = (index: number, by: -1 | 1) => {
    const next = [...steps]
    const [step] = next.splice(index, 1)
    next.splice(index + by, 0, step)
    onStepsChange(next)
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line-2 p-4">
      <div>
        <p className="flex items-center gap-1.5 text-[14px] font-semibold text-ink">
          <Sparkles className="size-4 text-ember-2" /> Aviso y paso a paso
        </p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-faint">
          Cada usuario ve el aviso una sola vez en la pantalla que elijas (los primeros 30 días), con el paso a paso
          para usar lo nuevo. Después lo puede volver a ver desde Mejoras.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="improvement-screen">Pantalla del aviso</Label>
        <select
          id="improvement-screen"
          value={screen ?? ''}
          onChange={e => {
            const next = e.target.value || null
            onScreenChange(next)
            if (next && steps.length === 0) onStepsChange([{ ...EMPTY_STEP }])
          }}
          className={fieldClass}
        >
          <option value="">Sin aviso (solo en Mejoras)</option>
          {GUIDE_SCREENS.map(s => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {screen && (
        <>
          <datalist id="guide-anchors">
            {KNOWN_ANCHORS.map(anchor => (
              <option key={anchor} value={anchor} />
            ))}
          </datalist>

          <ol className="flex flex-col gap-2.5">
            {steps.map((step, i) => (
              <li key={i} className="flex flex-col gap-2 rounded-xl border border-line-2 bg-paper-2 p-3">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ember text-[11.5px] font-semibold text-on-ember tabular-nums">
                    {i + 1}
                  </span>
                  <Input
                    aria-label={`Título del paso ${i + 1}`}
                    value={step.title}
                    maxLength={80}
                    onChange={e => setStep(i, { title: e.target.value })}
                    placeholder={i === 0 ? 'Tocá «Nuevo chat»' : 'Qué tiene que hacer'}
                    className="h-9 bg-paper"
                  />
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Subir"
                    className={iconButton}
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === steps.length - 1}
                    aria-label="Bajar"
                    className={iconButton}
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onStepsChange(steps.filter((_, j) => j !== i))}
                    aria-label="Quitar el paso"
                    className={`${iconButton} hover:text-destructive`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <textarea
                  aria-label={`Texto del paso ${i + 1}`}
                  value={step.text ?? ''}
                  maxLength={400}
                  rows={2}
                  onChange={e => setStep(i, { text: e.target.value })}
                  placeholder="Qué pasa ahí o cómo se usa (opcional)."
                  className={`${fieldClass} bg-paper`}
                />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <Input
                    aria-label={`Elemento que marca el paso ${i + 1}`}
                    list="guide-anchors"
                    value={step.target ?? ''}
                    maxLength={60}
                    onChange={e =>
                      setStep(i, {
                        target: e.target.value.toLowerCase().replace(/\s+/g, '-') || null,
                        waitForClick: e.target.value ? step.waitForClick : false,
                      })
                    }
                    placeholder="Elemento a marcar (data-help)"
                    className="h-9 min-w-0 flex-1 bg-paper font-mono text-[12.5px]"
                  />
                  <label
                    className={`flex items-center gap-2 text-[12.5px] ${step.target ? 'text-ink-3' : 'text-faint'}`}
                  >
                    <input
                      type="checkbox"
                      className="size-4 accent-ember-2"
                      checked={step.waitForClick}
                      disabled={!step.target}
                      onChange={e => setStep(i, { waitForClick: e.target.checked })}
                    />
                    Avanza cuando lo toca
                  </label>
                </div>
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={steps.length >= MAX_GUIDE_STEPS}
              onClick={() => onStepsChange([...steps, { ...EMPTY_STEP }])}
            >
              <Plus className="size-3.5" /> Agregar paso
            </Button>
            <span className="text-[11.5px] text-faint tabular-nums">
              {steps.length} de {MAX_GUIDE_STEPS}
            </span>
          </div>

          <p className="text-[11.5px] leading-relaxed text-faint">
            Sin pasos, el aviso solo cuenta la novedad. Cada paso marca un elemento de la pantalla por su{' '}
            <code className="font-mono">data-help</code> (el de la función nueva se agrega en el código, ej.{' '}
            <code className="font-mono">chat-nuevo</code>); sin elemento, el paso se ve en el medio. Si tocarlo abre un
            diálogo o un menú, tildá «Avanza cuando lo toca»: adentro de un diálogo, todos los pasos menos el último
            tienen que avanzar así.
          </p>
        </>
      )}
    </div>
  )
}

/** The preview column's part: the card as the screen shows it, and the guide one step at a time. */
export function ImprovementGuidePreview({
  title,
  summary,
  screen,
  steps,
}: {
  title: string
  summary: string
  screen: string
  steps: ImprovementStep[]
}) {
  const [index, setIndex] = useState(0)
  const ready = steps.filter(step => step.title.trim())
  const current = Math.min(index, Math.max(ready.length - 1, 0))
  const step = ready[current]

  return (
    <>
      <span className="mt-2 text-[10.5px] font-semibold tracking-[0.16em] text-faint uppercase">
        El aviso en {guideScreenLabel(screen)}
      </span>
      <AnnouncementCard
        guide={{ title: title || 'Título de la mejora', summary: summary || 'El resumen.', screen, steps: ready }}
        onPlay={() => setIndex(0)}
        onDismiss={() => undefined}
        className="max-w-[360px] shrink-0"
      />
      {step && (
        <>
          <span className="mt-2 text-[10.5px] font-semibold tracking-[0.16em] text-faint uppercase">
            El paso a paso{step.target ? ` · marca ${step.target}` : ' · en el medio de la pantalla'}
          </span>
          <GuideCard
            heading={`Novedad en ${guideScreenLabel(screen)}`}
            title={step.title}
            text={step.text}
            index={current}
            total={ready.length}
            onBack={() => setIndex(current - 1)}
            onNext={() => setIndex(current === ready.length - 1 ? 0 : current + 1)}
            className="max-w-[370px] shrink-0"
          />
        </>
      )}
    </>
  )
}
