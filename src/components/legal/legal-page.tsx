import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Footer } from "@/components/sections/final-cta";
import type { LegalDocument } from "@/lib/legal/types";
import { SITE, whatsappUrl } from "@/lib/site";

/** A legal page (privacy, terms) in the landing's look: title, index, numbered sections and contact. */
export function LegalPage({ doc }: { doc: LegalDocument }) {
  return (
    <>
      <header className="border-b border-fg/6">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-5 sm:px-8 lg:h-[72px] lg:px-10">
          <Link href="/" aria-label="Polisend, ir al inicio" className="text-[20px] text-fg sm:text-[22px]">
            <Logo />
          </Link>
          <Link href="/" className="text-[14px] font-medium text-fg/65 transition-colors hover:text-fg">
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="max-w-[760px]">
          <p className="font-mono text-[12px] tracking-[0.2em] text-brand uppercase">Legales</p>
          <h1 className="mt-5 font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[0.95] font-bold tracking-[-0.04em]">
            {doc.title}{" "}
            <span className="font-serif font-normal tracking-[-0.02em] text-brand italic">{doc.highlight}</span>
          </h1>
          <p className="mt-6 text-[17px] leading-relaxed text-fg/70">{doc.intro}</p>
          <p className="mt-4 font-mono text-[12px] text-mute">Última actualización · {doc.updated}</p>
        </div>

        <div className="mt-14 grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav aria-label="En esta página" className="lg:sticky lg:top-8 lg:self-start">
            <p className="mb-3 font-mono text-[11.5px] tracking-[0.16em] text-mute uppercase">En esta página</p>
            <ol className="flex flex-col gap-1.5 text-[14px]">
              {doc.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="text-fg/60 transition-colors hover:text-brand">
                    {section.title}
                  </a>
                </li>
              ))}
              <li>
                <a href="#contacto" className="text-fg/60 transition-colors hover:text-brand">
                  Contacto
                </a>
              </li>
            </ol>
          </nav>

          <div className="max-w-[760px] divide-y divide-fg/8">
            {doc.sections.map((section) => (
              <article key={section.id} id={section.id} className="scroll-mt-8 py-8 first:pt-0">
                <h2 className="font-display text-[clamp(1.25rem,2.2vw,1.6rem)] leading-tight font-semibold tracking-[-0.02em] text-fg">
                  {section.title}
                </h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)} className="mt-4 text-[15.5px] leading-relaxed text-fg/70">
                    {paragraph}
                  </p>
                ))}
                {section.items && (
                  <dl className="mt-5 flex flex-col gap-4">
                    {section.items.map((item) => (
                      <div key={item.term}>
                        <dt className="font-display text-[15.5px] font-semibold text-fg">{item.term}</dt>
                        <dd className="mt-1 text-[15px] leading-relaxed text-fg/70">{item.detail}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {section.list && (
                  <ul className="mt-4 flex flex-col gap-2.5">
                    {section.list.map((line) => (
                      <li key={line} className="flex gap-3 text-[15px] leading-relaxed text-fg/70">
                        <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-brand" />
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}

            <article id="contacto" className="scroll-mt-8 py-8">
              <h2 className="font-display text-[clamp(1.25rem,2.2vw,1.6rem)] leading-tight font-semibold tracking-[-0.02em] text-fg">
                Contacto
              </h2>
              <p className="mt-4 text-[15.5px] leading-relaxed text-fg/70">
                Para consultas sobre esta página o para ejercer tus derechos:
              </p>
              <ul className="mt-4 flex flex-col gap-2 text-[15.5px]">
                {SITE.legalEmail && (
                  <li>
                    <a href={`mailto:${SITE.legalEmail}`} className="font-medium text-brand hover:text-brand-2">
                      {SITE.legalEmail}
                    </a>
                  </li>
                )}
                <li>
                  <a
                    href={whatsappUrl("Hola, tengo una consulta sobre mis datos o los términos de Polisend.")}
                    className="font-medium text-brand hover:text-brand-2"
                  >
                    WhatsApp {SITE.phoneDisplay}
                  </a>
                </li>
              </ul>
            </article>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
