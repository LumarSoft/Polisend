"use client";

import { useRef } from "react";
import { Eyebrow, SplitReveal } from "@/components/ui/primitives";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

const STEPS = [
  {
    n: "01",
    t: "Hablamos",
    d: "Nos escribís por WhatsApp. Vemos cómo trabaja tu productora, con qué compañías y cuántos asegurados atendés.",
  },
  {
    n: "02",
    t: "Conectamos",
    d: "Tu WhatsApp a la API oficial de Meta, tus códigos de productor y tu cartera desde la compañía. Nosotros lo dejamos andando.",
  },
  {
    n: "03",
    t: "Sale a atender",
    d: "Con tu nombre, tu tono y tus horarios. Tus asegurados siguen escribiendo como siempre; vos mirás todo desde el panel.",
  },
];

export function Steps() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(".steps-line", {
          scaleX: 0,
          ease: "none",
          scrollTrigger: { trigger: ".steps-grid", start: "top 90%", end: "bottom 70%", scrub: 0.6 },
        });
        gsap.from(".step-num", {
          yPercent: 100,
          stagger: 0.1,
          duration: 0.9,
          ease: "expo.out",
          scrollTrigger: { trigger: ".steps-grid", start: "top 92%", once: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="empezar" className="relative py-20 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow>Cómo empezás</Eyebrow>
            <SplitReveal className="mt-5 font-display text-[clamp(2.4rem,5.4vw,5rem)] leading-[0.93] font-bold tracking-[-0.04em]">
              Tres pasos. <span className="font-serif font-normal tracking-[-0.02em] text-fg/70 italic">Cero instalaciones.</span>
            </SplitReveal>
          </div>
          <p data-reveal className="max-w-[420px] text-[16.5px] leading-relaxed text-fg/60">
            No tenés que aprender un sistema nuevo ni cambiar cómo trabajás. Tus clientes ni se enteran: solo notan que
            ahora les contestan.
          </p>
        </div>
        <div className="steps-grid relative mt-16 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          <div className="steps-line absolute top-[38px] right-0 left-0 hidden h-px origin-left bg-[linear-gradient(90deg,var(--color-brand),rgb(31_79_224/0.1))] md:block" />
          {STEPS.map((s) => (
            <div key={s.n} className="relative">
              <div className="overflow-hidden">
                <span className="step-num block font-display text-[76px] leading-none font-bold tracking-[-0.045em] text-brand">{s.n}</span>
              </div>
              <h3 className="mt-6 font-display text-[28px] font-semibold tracking-[-0.03em]">{s.t}</h3>
              <p className="mt-2 max-w-[380px] text-[15.5px] leading-relaxed text-fg/60">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
