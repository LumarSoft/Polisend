'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lightbulb } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ProposalForm } from './proposals-board'

/**
 * "Proponer mejora" in the panel's top bar, on every screen. The board lives
 * in Ayuda → Mejoras → Propuestas and few people found it: here the form opens
 * in place, and the proposal says which screen it was sent from.
 */
export function ProposeImprovementButton({ screen, className }: { screen: string; className?: string }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            data-help="proponer-mejora"
            onClick={() => setOpen(true)}
            className={cn(
              'flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line-2 bg-background px-2.5 text-[12.5px] text-ink-3 shadow-xs transition-colors',
              'hover:border-ember/40 hover:bg-ember-soft hover:text-ember-2',
              className,
            )}
          >
            <Lightbulb className="size-4" />
            <span className="hidden font-medium sm:inline">Proponer mejora</span>
            <span className="sr-only sm:hidden">Proponer una mejora</span>
          </button>
        </TooltipTrigger>
        <TooltipContent className="sm:hidden">Proponer una mejora</TooltipContent>
      </Tooltip>
      <DialogContent className="gap-5 sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Lightbulb className="size-4 text-ember-2" /> Proponer una mejora
          </DialogTitle>
          <DialogDescription>
            ¿Algo que te haría el trabajo más fácil o que no anda como esperabas? Contanos y lo vemos. La propuesta la
            ve toda tu oficina en Mejoras.
          </DialogDescription>
        </DialogHeader>
        <ProposalForm
          bare
          screen={screen}
          onCreated={() => setOpen(false)}
          toastAction={{ label: 'Ver propuestas', onClick: () => router.push('/admin/mejoras?tab=propuestas') }}
        />
      </DialogContent>
    </Dialog>
  )
}
