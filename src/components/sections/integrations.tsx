"use client";

import { useRef } from "react";
import { ArrowsClockwise, Car, WhatsappLogo } from "@phosphor-icons/react";
import { LogoMark } from "@/components/brand/logo";
import { Eyebrow, SplitReveal } from "@/components/ui/primitives";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/cn";

const NODES = [
  { side: "l", name: "Triunfo Seguros", tag: "Compañía", items: "Cartera · cuotas · documentos · cotizador", color: "#1f4fe0" },
  { side: "l", name: "Sancor Seguros", tag: "Compañía", items: "Cartera · cuotas · documentos · cotizador", color: "#1f4fe0" },
  { side: "r", name: "WhatsApp Business", tag: "API oficial de Meta", items: "Botones, listas, fotos y documentos", color: "#12b76a", icon: WhatsappLogo },
  { side: "r", name: "InfoAuto", tag: "Catálogo", items: "Marcas, modelos y versiones para cotizar", color: "#7c5cfc", icon: Car },
];

function Node({ n, className }: { n: (typeof NODES)[number]; className?: string }) {
  const Icon = n.icon;
  const left = n.side === "l";
  return (
    <div className={cn("int-node relative rounded-2xl border border-fg/8 bg-canvas-2 p-4 shadow-[0_10px_30px_-18px_rgb(11_21_38/0.25)]", className)}>
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 hidden h-px w-10 bg-fg/15 lg:block",
          left ? "left-full" : "right-full",
        )}
      >
        <span
          className={cn("absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full", left ? "animate-[flow_1.6s_linear_infinite]" : "animate-[flow-back_1.6s_linear_infinite]")}
          style={{ background: n.color }}
        />
      </span>
      <div className="flex items-center gap-2 text-[12px] text-mute font-medium">
        {n.tag}
      </div>
      <p className="mt-1.5 flex items-center gap-2 font-display text-[20px] font-semibold tracking-[-0.03em] text-fg">
        {Icon && <Icon weight="fill" className="size-5" style={{ color: n.color }} />}
        {n.name}
      </p>
      <p className="mt-0.5 text-[13px] text-fg/65">{n.items}</p>
    </div>
  );
}

export function Integrations() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(".int-node", {
          x: (i) => (i < 2 ? -60 : 60),
          autoAlpha: 0,
          stagger: 0.1,
          duration: 1.1,
          ease: "expo.out",
          scrollTrigger: { trigger: ".int-map", start: "top 88%", once: true },
        });
        gsap.from(".int-core", {
          scale: 0.4,
          autoAlpha: 0,
          duration: 1.2,
          ease: "back.out(1.6)",
          scrollTrigger: { trigger: ".int-map", start: "top 88%", once: true },
        });
        gsap.from(".int-sync-fill", {
          scaleX: 0,
          ease: "none",
          scrollTrigger: { trigger: ".int-sync", start: "top 85%", end: "top 45%", scrub: 1 },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="integraciones" className="relative overflow-hidden py-20 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[920px] text-center">
          <Eyebrow>Integración con Triunfo y Sancor</Eyebrow>
          <SplitReveal className="mt-5 font-display text-[clamp(2.4rem,5.8vw,5.4rem)] leading-[0.93] font-bold tracking-[-0.04em]">
            Conectado a tu compañía.{" "}
            <span className="font-serif font-normal tracking-[-0.02em] text-brand italic">Al día, solo.</span>
          </SplitReveal>
          <p data-reveal className="mx-auto mt-6 max-w-[640px] text-[17px] leading-relaxed text-fg/65">
            Pólizas, vehículos, cuotas y novedades llegan directo de la compañía. Lo que el bot le responde a tu
            asegurado es lo mismo que ves vos: sin cargar nada a mano.
          </p>
        </div>

        <div className="int-map relative mx-auto mt-16 grid grid-cols-1 max-w-[1180px] items-center gap-4 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
          <div className="grid min-w-0 grid-cols-1 gap-4">
            <Node n={NODES[0]} />
            <Node n={NODES[1]} />
          </div>
          <div className="int-core relative mx-auto grid size-[150px] place-items-center rounded-[40px] bg-brand text-on-brand shadow-[0_0_80px_-10px_rgb(31_79_224/0.6)]">
            <span className="absolute inset-0 animate-pulse-ring rounded-[40px] border-2 border-brand" />
            <div className="text-center">
              <LogoMark className="mx-auto h-12 w-auto" />
              <p className="mt-1 font-logo text-[16px] font-bold tracking-[-0.04em]">polisend</p>
            </div>
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-4">
            <Node n={NODES[2]} />
            <Node n={NODES[3]} />
          </div>
        </div>

        <div className="int-sync mx-auto mt-16 max-w-[1180px] rounded-[28px] border border-fg/8 bg-canvas-2 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-brand/12 text-brand">
                <ArrowsClockwise className="size-5" />
              </span>
              <div>
                <p className="font-display text-[20px] font-semibold tracking-tight">La cartera se sincroniza sola</p>
                <p className="text-[14px] text-fg/65">Dos veces por día, todos los días. Sin exportar, sin planillas.</p>
              </div>
            </div>
            <span className="rounded-full border border-mint/30 bg-mint/10 px-3 py-1.5 font-mono text-[11px] text-[#067647]">
              ✓ Última sincronización 06:00
            </span>
          </div>
          <div className="relative mt-10 mb-2">
            <div className="h-2 rounded-full bg-fg/6">
              <div className="int-sync-fill h-full origin-left rounded-full bg-[linear-gradient(90deg,rgb(31_79_224/0.25),#1f4fe0)]" />
            </div>
            {[
              { h: 6, l: "06:00" },
              { h: 20, l: "20:00" },
            ].map((p) => (
              <div key={p.l} className="absolute -top-[26px] -translate-x-1/2 text-center" style={{ left: `${(p.h / 24) * 100}%` }}>
                <span className="font-mono text-[11px] font-semibold text-brand">{p.l}</span>
                <span className="mx-auto mt-1.5 block size-4 rounded-full border-[3px] border-canvas-2 bg-brand shadow-[0_0_0_4px_rgb(31_79_224/0.2)]" />
              </div>
            ))}
            <div className="mt-3 flex justify-between font-mono text-[10.5px] text-mute">
              <span>00</span>
              <span>06</span>
              <span>12</span>
              <span>18</span>
              <span>24</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
