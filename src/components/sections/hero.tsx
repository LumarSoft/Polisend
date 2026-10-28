"use client";

import { useRef } from "react";
import { BellRinging, MoonStars, Play } from "@phosphor-icons/react";
import { Phone } from "@/components/chat/phone";
import { HERO_SCENARIOS } from "@/components/chat/scripts";
import { CtaButton } from "@/components/ui/primitives";
import { MessageField } from "./message-field";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { useChatPlayer, useInView } from "@/lib/hooks";
import { SITE } from "@/lib/site";

const FACTS = [
  { k: "Responde", v: "En segundos", s: "24 h · 7 días · feriados" },
  { k: "Integrado con", v: "Triunfo y Sancor", s: "Cartera, documentos y cotizador" },
  { k: "Precio", v: `USD ${SITE.priceUsd}/mes`, s: `Cada ${SITE.messagesPerPlan.toLocaleString("es-AR")} mensajes` },
];

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const [viewRef, inView] = useInView<HTMLDivElement>("-10% 0px");
  const { state, scenario } = useChatPlayer(HERO_SCENARIOS, inView);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // Headline, copy and facts enter with CSS from the first paint (fast
        // LCP); GSAP only brings in the decorative phone and floating cards.
        const tl = gsap.timeline({ defaults: { ease: "expo.out" }, delay: 0.15 });
        tl.set("[data-hero]", { autoAlpha: 1 })
          .from(".hero-phone", { y: 160, rotate: 7, autoAlpha: 0, duration: 1.6 }, 0.2)
          .from(".hero-float", { scale: 0.6, autoAlpha: 0, stagger: 0.15, duration: 1, ease: "back.out(1.7)" }, 0.9);

        // Scroll-out: the phone drifts up, the headline sinks and dims.
        gsap.to(".hero-phone-wrap", {
          yPercent: -18,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero-text", {
          yPercent: 12,
          autoAlpha: 0.25,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "center center", end: "bottom top", scrub: true },
        });

        // Floating cards follow the pointer at different depths.
        const onMove = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          gsap.utils.toArray<HTMLElement>(".hero-float").forEach((el, i) => {
            const depth = (i + 1) * 14;
            gsap.to(el, { x: nx * depth, y: ny * depth, duration: 1.2, ease: "power3.out" });
          });
          gsap.to(".hero-phone", { rotateY: nx * 8, rotateX: -ny * 6, duration: 1.4, ease: "power3.out" });
        };
        window.addEventListener("pointermove", onMove);
        return () => window.removeEventListener("pointermove", onMove);
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="inicio"
      className="relative isolate overflow-hidden pt-28 pb-14 lg:min-h-[100svh] lg:pt-32"
    >
      {/* background */}
      <div className="grid-lines absolute inset-0 -z-20 [mask-image:radial-gradient(ellipse_at_70%_40%,#000_10%,transparent_70%)]" />
      <div className="absolute top-[8%] right-[-10%] -z-20 size-[60vw] max-w-[900px] rounded-full bg-[radial-gradient(circle,rgb(31_79_224/0.12),transparent_62%)] blur-2xl" />
      <MessageField targetRef={phoneRef} className="pointer-events-none absolute inset-0 -z-10 hidden size-full [mask-image:linear-gradient(to_right,rgb(0_0_0/0.3),#000_60%)] lg:block" />

      <div
        ref={viewRef}
        className="mx-auto grid grid-cols-1 max-w-[1400px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.18fr_0.82fr] lg:gap-6 lg:px-10"
      >
        <div className="hero-text relative z-10">
          <h1 className="font-display text-[clamp(3.3rem,7.6vw,8.6rem)] leading-[0.86] font-bold tracking-[-0.045em] text-fg">
            <span className="mb-7 block animate-[rise_0.8s_var(--ease-out-expo)_both] font-sans text-[15px] leading-normal font-medium tracking-[-0.01em] text-fg/70">
              Bot de WhatsApp con IA para productores asesores de seguros
            </span>
            <span className="sr-only">. </span>
            <span className="block animate-[rise_0.9s_var(--ease-out-expo)_both] [animation-delay:60ms]">Tu WhatsApp</span>{" "}
            <span className="block animate-[rise_0.9s_var(--ease-out-expo)_both] [animation-delay:140ms]">
              atiende <span className="text-brand">solo.</span>
            </span>{" "}
            <span className="mt-4 block animate-[rise_1s_var(--ease-out-expo)_both] font-serif text-[0.5em] leading-[1] font-normal tracking-[-0.015em] text-fg/75 italic [animation-delay:300ms]">
              y sabe con quién habla.
            </span>
          </h1>

          <div className="mt-8 max-w-[560px] animate-[rise_0.9s_var(--ease-out-expo)_both] [animation-delay:380ms]">
            <p className="text-[17px] leading-relaxed text-fg/70 sm:text-[18.5px]">
              Polisend identifica a cada asegurado por <b className="font-semibold text-fg">DNI o patente</b> y
              resuelve en el chat lo que hoy te llena el día:{" "}
              <b className="font-semibold text-fg">denuncias de siniestro con fotos, cuotas, documentación y cotizaciones</b>.
              Lo que necesita una persona te llega ordenado al panel.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <CtaButton />
              <a
                href="#historia"
                data-autoplay
                className="group inline-flex items-center gap-2.5 text-[15px] font-medium text-fg/80 transition-colors hover:text-brand"
              >
                <span className="grid size-8 place-items-center rounded-full border border-fg/15 transition-colors duration-300 group-hover:border-brand group-hover:bg-brand group-hover:text-on-brand">
                  <Play weight="fill" className="size-3 translate-x-px" />
                </span>
                Mirá un siniestro de punta a punta
              </a>
            </div>
          </div>

          <dl className="mt-12 grid max-w-[640px] animate-[rise_0.9s_var(--ease-out-expo)_both] grid-cols-3 gap-px overflow-hidden rounded-2xl border border-fg/8 bg-fg/8 [animation-delay:520ms]">
            {FACTS.map((f) => (
              <div key={f.k} className="bg-canvas-2 px-3 py-3.5 sm:px-5 sm:py-4">
                <dt className="text-[11.5px] text-mute sm:text-[10.5px] sm:tracking-[0.14em] font-medium">{f.k}</dt>
                <dd className="mt-1 font-display text-[15px] leading-tight font-semibold tracking-tight text-fg sm:text-[21px]">{f.v}</dd>
                <dd className="hidden text-[12.5px] text-mute sm:block">{f.s}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="hero-phone-wrap relative mx-auto flex flex-col items-center [perspective:1200px]">
          <div
            data-hero
            className="hero-float relative z-20 mb-4 inline-flex items-center gap-2 rounded-full border border-fg/10 bg-canvas-2/80 px-3.5 py-1.5 text-[13px] text-fg/70 backdrop-blur"
          >
            {scenario.label}
          </div>

          <div ref={phoneRef} data-hero className="hero-phone relative [transform-style:preserve-3d]">
            <Phone state={state} className="h-[540px] w-[282px] sm:h-[640px] sm:w-[312px]" />
          </div>

          <div
            data-hero
            className="hero-float absolute top-[17%] -left-[64%] z-20 hidden w-[230px] rounded-2xl border border-fg/10 bg-canvas-2 p-3.5 shadow-[0_20px_50px_-20px_rgb(11_21_38/0.25)] xl:block"
          >
            <div className="flex items-center gap-2 text-[12px] text-mute font-medium">
              <MoonStars className="size-3.5 text-violet" /> Fuera de horario
            </div>
            <p className="mt-2 text-[13px] leading-snug text-fg/85">
              Tu oficina está <span className="text-coral">cerrada</span>. Polisend está{" "}
              <span className="text-brand">atendiendo</span>.
            </p>
          </div>

          <div
            data-hero
            className="hero-float absolute right-[-46%] bottom-[16%] z-20 hidden w-[250px] rounded-2xl border border-fg/10 bg-fg p-3.5 text-canvas shadow-2xl xl:block"
          >
            <div className="flex items-center justify-between text-[12px] text-canvas/50 font-medium">
              <span className="flex items-center gap-1.5">
                <BellRinging className="size-3.5 text-canvas" /> Novedades
              </span>
              <span>ahora</span>
            </div>
            <p className="mt-2 text-[13.5px] leading-snug font-semibold">Nuevo siniestro · Lucía G.</p>
            <p className="text-[12px] text-canvas/60">Peugeot 208 · 4 adjuntos · Pendiente</p>
          </div>
        </div>
      </div>
    </section>
  );
}
