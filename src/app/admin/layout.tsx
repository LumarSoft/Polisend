import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { AuthProvider } from '@/features/admin/context/auth-context'
import { PanelThemeProvider } from '@/features/admin/context/panel-theme-context'
import { PanelToaster } from '@/features/admin/components/panel-toaster'
import { PANEL_THEME_SCRIPT } from '@/features/admin/lib/panel-theme'
import { Providers } from './providers'
import './panel.css'

// The panel has its own root layout (fonts, theme and styles apart from the landing's), so going from the landing
// to /admin is a full page load and neither stylesheet leaks into the other.
const manrope = localFont({
  src: './fonts/Manrope.ttf',
  variable: '--font-manrope',
  weight: '200 800',
  display: 'swap',
})

const inter = localFont({
  src: './fonts/Inter.ttf',
  variable: '--font-inter',
  weight: '400 900',
  display: 'swap',
})

// The panel is a client app behind a login: it reads the URL and the session in the browser, so it renders on each
// request instead of being prerendered. The landing keeps Cache Components' static shell.
export const instant = false

export const metadata: Metadata = {
  title: 'Panel · Polisend',
  description: 'Panel de gestión de Polisend, el asistente de WhatsApp para productores de seguros.',
  robots: { index: false, follow: false },
}

export default function AdminRootLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <html lang="es" className={`${manrope.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PANEL_THEME_SCRIPT }} />
      </head>
      <body>
        <Providers>
          <PanelThemeProvider>
            <AuthProvider>
              {children}
              <PanelToaster />
            </AuthProvider>
          </PanelThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
