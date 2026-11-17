'use client'

import { useEffect, useState, useSyncExternalStore, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '../context/auth-context'
import { readRememberedLoginEmail, useLoginSubmit } from '../hooks/use-login'
import { useRole } from '../hooks/use-role'
import { homePathFor } from '../lib/roles'
import { LoginTwoFactorStep } from './login-two-factor-step'

const subscribeNothing = () => () => {}

export function LoginForm() {
  const router = useRouter()
  const { isAuthenticated, hydrated } = useAuth()
  const { role } = useRole()
  const login = useLoginSubmit()

  // The e-mail /admin/activar left, until the person types another.
  const rememberedEmail = useSyncExternalStore(subscribeNothing, readRememberedLoginEmail, () => '')
  const [typedEmail, setEmail] = useState<string | null>(null)
  const email = typedEmail ?? rememberedEmail
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Logged in (here or already): to the role's home once the profile says which.
  useEffect(() => {
    if (hydrated && isAuthenticated && role) router.replace(homePathFor(role))
  }, [hydrated, isAuthenticated, role, router])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    login.submitPassword({ email, password })
  }

  const errorMessage = login.errorMessage
  const onCodeStep = login.step.kind === 'two-factor'

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-canvas px-5 py-16">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closed,_var(--tw-gradient-stops))] from-ember-soft to-transparent blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ember/40 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[400px]"
      >
        <div className="mb-8 text-center">
          <BrandMark size={48} className="mx-auto mb-5 rounded-2xl shadow-md" />
          <div className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.36em] text-ember-2">
            Polisend · Panel de administración
          </div>
          <h1 className="font-display text-[30px] leading-none text-ink">
            {onCodeStep ? 'Verificación en dos pasos' : 'Iniciá sesión'}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {onCodeStep
              ? 'Tu cuenta tiene la verificación en dos pasos activa.'
              : 'Gestioná usuarios y la configuración de la plataforma.'}
          </p>
        </div>

        {onCodeStep ? (
          <LoginTwoFactorStep
            isSubmitting={login.isSubmitting}
            errorMessage={errorMessage}
            onSubmit={login.submitCode}
            onClearError={login.clearError}
            onBack={login.restart}
          />
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 rounded-3xl border border-line-2 bg-paper p-7 shadow-[0_30px_70px_-30px_rgba(15,13,10,0.25)]"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="nombre@tuproductora.com"
                  className="h-11 pl-9"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value)
                    login.clearError()
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="h-11 pl-9 pr-10"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                    login.clearError()
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <Button type="submit" disabled={login.isSubmitting} className="mt-2 h-11 w-full text-[14px]">
              {login.isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Ingresando…
                </>
              ) : (
                'Iniciar sesión'
              )}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-[12px] text-muted-foreground">Polisend · desarrollado por Lumarsoft</p>
      </motion.div>
    </div>
  )
}
