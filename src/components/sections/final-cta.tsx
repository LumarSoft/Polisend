"use client";

import { useRef } from "react";
import { Logo } from "@/components/brand/logo";
import { CtaButton } from "@/components/ui/primitives";
import { gsap, MOTION_OK, SplitText, useGSAP } from "@/lib/gsap";

export function FinalCta() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const split = SplitText.create(".fc-title", { type: "words", mask: "words" });
        gsap.set(".fc-title", { autoAlpha: 1 });
        gsap.from(split.words, {
          yPercent: 110,
          stagger: 0.04,
          duration: 1.1,
          ease: "expo.out",
          scrollTrigger: { trigger: root.current, start: "top 82%", once: true },
        });
        gsap.fromTo(
          ".fc-glow",
          { scale: 0.6, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "center center", scrub: 1 } },
        );
        return () => split.revert();
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative overflow-hidden py-24 sm:py-40">
      <div className="fc-glow absolute top-1/2 left-1/2 -z-10 size-[110vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(31_79_224/0.2),transparent_60%)]" />
      <div className="mx-auto max-w-[1300px] px-5 text-center sm:px-8">
        <h2 data-split className="fc-title font-display text-[clamp(2.6rem,7.6vw,7.4rem)] leading-[0.9] font-bold tracking-[-0.042em] text-balance">
          ¿Cuántos mensajes contestaste hoy{" "}
          <span className="font-serif font-normal tracking-[-0.02em] text-brand italic">que podían contestarse solos?</span>
        </h2>
        <div data-reveal className="mt-12 flex flex-col items-center gap-4">
          <CtaButton size="lg">Quiero Polisend</CtaButton>
          <p className="text-[14px] text-mute">Te respondemos por WhatsApp. Obvio.</p>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-fg/6">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-10 px-5 py-14 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div>
          <Logo className="text-[34px] text-fg" />
          <p className="mt-4 max-w-[360px] text-[14.5px] leading-relaxed text-fg/65">
            Polisend es el bot de WhatsApp con IA y el panel de gestión para productores asesores de seguros de Argentina. Un producto de Lumarsoft, hecho en Rosario.
          </p>
        </div>
        <nav aria-label="Pie de página" className="grid grid-cols-2 gap-x-12 gap-y-2 text-[14px] text-fg/60 sm:grid-cols-3">
          {[
            ["/#bot", "El bot"],
            ["/#velocidad", "Velocidad"],
            ["/#asesor", "Asesor humano"],
            ["/#panel", "Panel"],
            ["/#integraciones", "Integraciones"],
            ["/#precio", "Precio"],
            ["/#faq", "Preguntas"],
            ["/#empezar", "Cómo empezás"],
            ["/privacidad", "Privacidad"],
            ["/terminos", "Términos"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="transition-colors hover:text-brand">
              {label}
            </a>
          ))}
        </nav>
      </div>
      <div className="border-t border-fg/6">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-5 py-6 font-mono text-[11.5px] text-mute sm:flex-row sm:justify-between sm:px-8 lg:px-10">
          <span>© 2026 Polisend · Un producto de Lumarsoft · Rosario, Argentina</span>
          <span>WhatsApp es una marca de Meta. Triunfo y Sancor son marcas de sus respectivos titulares.</span>
        </div>
      </div>
    </footer>
  );
}
