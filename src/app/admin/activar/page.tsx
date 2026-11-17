import type { Metadata } from 'next'
import { BrandMark } from '@/components/brand-mark'

// Public: outside the (panel) group, so the panel's session gate never runs here, like /admin/login. The link's
// token must not leak to other sites.
export const metadata: Metadata = {
  title: 'Elegí tu contraseña · Polisend',
  referrer: 'no-referrer',
}

// Placeholder of the foundation. Owned by the auth front (password-setup links and two-step verification): it
// replaces this with the page of the contract (docs/handoff/owner-zones-step3/contract-final.md, addendum §3), built on
// usePasswordSetupInfo(token) and useCompletePasswordSetup(), then rememberLoginEmail(email) before /admin/login.
export default function ActivatePage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-canvas px-5 py-16">
      <div className="w-full max-w-[400px] text-center">
        <BrandMark size={48} className="mx-auto mb-5 rounded-2xl shadow-md" />
        <h1 className="font-display text-[26px] leading-tight text-ink">Elegí tu contraseña para entrar</h1>
        <p className="mt-3 text-sm text-muted-foreground">Esta página todavía se está preparando.</p>
      </div>
    </div>
  )
}
