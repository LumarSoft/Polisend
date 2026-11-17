import type { ReactNode } from 'react'

/** A screen another piece of work is building: its title and what it will show. Replace it with the real view. */
export function PagePlaceholder({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 md:px-8 md:py-10">
      <div className="text-[10.5px] font-medium uppercase tracking-[0.3em] text-ember-2">{eyebrow}</div>
      <h1 className="mt-2 font-display text-[clamp(26px,3.5vw,36px)] tracking-[-0.035em] text-ink">{title}</h1>
      <p className="mt-1.5 max-w-2xl text-[14px] text-muted-foreground">{children}</p>
    </div>
  )
}
