import type { Metadata } from 'next'
import { PasswordResetView } from '@/features/admin/components/password-reset-view'

// Public: outside the (panel) group, so the panel's session gate never runs here, like /admin/login and
// /admin/activar. Nothing of the person (e-mail, code) ever goes in the URL.
export const metadata: Metadata = {
  title: 'Recuperá tu contraseña · Polisend',
  referrer: 'no-referrer',
}

/** «¿Olvidaste tu contraseña?»: a code by e-mail, then a new password. */
export default function PasswordResetPage() {
  return <PasswordResetView />
}
