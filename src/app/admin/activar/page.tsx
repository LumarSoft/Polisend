import type { Metadata } from 'next'
import { ActivateAccountView } from '@/features/admin/components/activate-account-view'

// Public: outside the (panel) group, so the panel's session gate never runs here, like /admin/login. The link's
// token must not leak to other sites (next.config.ts also sends Referrer-Policy: no-referrer for this path).
export const metadata: Metadata = {
  title: 'Elegí tu contraseña · Polisend',
  referrer: 'no-referrer',
}

/** A password-setup link (`/admin/activar?token=…`): the browser reads the token and drops it from the URL. */
export default function ActivatePage() {
  return <ActivateAccountView />
}
