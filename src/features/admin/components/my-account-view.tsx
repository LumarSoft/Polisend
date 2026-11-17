'use client'

import { MyAccountSection } from './my-account-section'

/** /admin/cuenta: the account of whoever is logged in (the Developer's only way to its account). */
export function MyAccountView() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 md:px-8 md:py-10">
      <div className="mb-7">
        <div className="text-[10.5px] font-medium uppercase tracking-[0.3em] text-ember-2">Cuenta</div>
        <h1 className="mt-2 font-display text-[clamp(26px,3.5vw,36px)] tracking-[-0.035em] text-ink">Mi cuenta</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Tu nombre, tu correo, tu contraseña y la verificación en dos pasos.
        </p>
      </div>
      <MyAccountSection />
    </div>
  )
}
