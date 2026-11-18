'use client'

import { Lightbulb, Loader2, Sparkles } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MejorasEditorView } from '@/features/admin/components/mejoras-editor-view'
import { MejorasView } from '@/features/admin/components/mejoras-view'
import { PlatformProposalsView } from '@/features/admin/components/platform-proposals-view'
import { ProposalsBoard } from '@/features/admin/components/proposals-board'
import { NetworkFilter } from '@/features/admin/components/network-filter'
import { RequirePrincipal } from '@/features/admin/components/require-principal'
import { useNewProposalsCount } from '@/features/admin/hooks/use-proposals'
import { useRole } from '@/features/admin/hooks/use-role'
import { useUrlTab } from '@/features/admin/hooks/use-panel-link'

export default function MejorasPage() {
  const { isDeveloper, isLoading } = useRole()
  const { data: newProposals } = useNewProposalsCount(isDeveloper)
  const [tab, setTab] = useUrlTab(['mejoras', 'propuestas'] as const, 'mejoras')

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-display text-[22px] tracking-tight text-ink">
          <Sparkles className="size-5 text-ember-2" />
          Mejoras
        </h1>
        {/* An Owner's Zona › Principal: the proposals are each principal's. */}
        <NetworkFilter showProducer={false} />
      </div>
      <RequirePrincipal showFilter={false}>
        <Tabs value={tab} onValueChange={value => setTab(value as typeof tab)}>
          <TabsList variant="line" className="h-auto justify-start gap-1">
            <TabsTrigger value="mejoras" className="gap-1.5 px-3 py-1.5 text-[13.5px]">
              <Sparkles className="size-4" /> Mejoras
            </TabsTrigger>
            <TabsTrigger
              data-help="mejoras-propuestas"
              value="propuestas"
              className="gap-1.5 px-3 py-1.5 text-[13.5px]"
            >
              <Lightbulb className="size-4" /> Propuestas
              {isDeveloper && !!newProposals?.count && (
                <span className="rounded-full bg-ember px-1.5 text-[10.5px] font-semibold text-on-ember">
                  {newProposals.count}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          {/* Lumar writes and answers; everyone else reads and proposes. */}
          <TabsContent value="mejoras" className="mt-5">
            {isDeveloper ? <MejorasEditorView /> : <MejorasView />}
          </TabsContent>
          <TabsContent value="propuestas" className="mt-5">
            {isDeveloper ? <PlatformProposalsView /> : <ProposalsBoard />}
          </TabsContent>
        </Tabs>
      </RequirePrincipal>
    </div>
  )
}
