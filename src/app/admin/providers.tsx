'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { AdminUser } from '@/types/api/auth'
import { ActingPrincipalProvider, usePanelScope } from '@/features/admin/context/acting-principal-context'
import { AuthProvider } from '@/features/admin/context/auth-context'
import { PanelToaster } from '@/features/admin/components/panel-toaster'
import { PanelThemeProvider } from '@/features/admin/context/panel-theme-context'

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 1000 * 60 * 5 },
    },
  })
}

/**
 * Two levels of cache. The session's client holds what does not depend on the principal (the profile that says who
 * is logged in, an Owner's list of principals). Everything else lives in a client of its own per user and, for an
 * Owner, per acting principal: changing the principal remounts the panel content with a new client, so no screen,
 * filter, open sheet, draft or assistant conversation of one principal survives into another. Changing only the
 * productor does not remount anything: it is a filter.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [sessionClient] = useState(makeQueryClient)
  return (
    <QueryClientProvider client={sessionClient}>
      <PanelThemeProvider>
        <AuthProvider>
          <ActingPrincipalProvider>
            <PrincipalContent>{children}</PrincipalContent>
          </ActingPrincipalProvider>
          {/* Outside the principal's content: a toast survives the remount it announces. */}
          <PanelToaster />
        </AuthProvider>
      </PanelThemeProvider>
    </QueryClientProvider>
  )
}

function PrincipalContent({ children }: { children: ReactNode }) {
  const scope = usePanelScope()
  if (!scope.ready) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-sidebar">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return (
    <ScopedQueryClient key={scope.key} seedProfile={scope.seedProfile}>
      {children}
    </ScopedQueryClient>
  )
}

function ScopedQueryClient({ seedProfile, children }: { seedProfile: AdminUser | null; children: ReactNode }) {
  const [client] = useState(() => {
    const scoped = makeQueryClient()
    // The session already read the profile: every role but the Owner (whose profile names its acting principal)
    // starts from it instead of asking again.
    if (seedProfile) scoped.setQueryData(QUERY_KEYS.admin.profile, seedProfile)
    return scoped
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
