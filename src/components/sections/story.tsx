"use client";

import { useMemo, useRef, useState } from "react";
import {
  Check,
  EnvelopeSimple,
  Paperclip,
  Storefront,
} from "@phosphor-icons/react";
import { Phone } from "@/components/chat/phone";
import { STORY_CHAPTERS, STORY_STEPS } from "@/components/chat/scripts";
import { applySteps } from "@/components/chat/types";
import { Eyebrow } from "@/components/ui/primitives";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/cn";

const TOTAL = STORY_STEPS.length;

/** Step count at which the message with this id is on screen. */
const reach = (id: string) =>
  STORY_STEPS.findIndex((s) => s.do === "add" && s.msg.id === id) + 1;

const STAGES = [
  { label: "Identificada por patente", at: reach("s4") },
  { label: "Póliza elegida", at: reach("s7") },
  { label: "Fecha y relato", at: reach("s8") },
  { label: "Denuncia confirmada", at: reach("s10") },
  { label: "Fotos", at: reach("s14"), photos: true },
  { label: "Cargada en el panel", at: TOTAL },
];

const CHAPTERS = STORY_CHAPTERS.map((c) => ({ ...c, at: reach(c.from) - 1 }));

const PHOTO_TOTAL = STORY_STEPS.filter(
  (s) => s.do === "add" && s.msg.kind === "photo",
).length;

const toMinutes = (clock: string) => {
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + m;
};

export function Story() {
  const root = useRef<HTMLElement>(null);
  const [n, setN] = useState(TOTAL);
  const last = useRef(TOTAL);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const update = (progress: number) => {
          const next = Math.min(TOTAL, Math.floor((progress / 0.9) * (TOTAL + 1)));
          if (next !== last.current) {
            last.current = next;
            setN(next);
          }
        };
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top top",
          end: "+=190%",
          pin: true,
          scrub: true,
          onUpdate: (self) => update(self.progress),
          onRefresh: (self) => update(self.progress),
        });
        update(st.progress);

        gsap.from(".st-intro > *", {
          y: 40,
          autoAlpha: 0,
          stagger: 0.1,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
        });
        return () => st.kill();
      });
    },
    { scope: root },
  );

  const state = useMemo(() => applySteps(STORY_STEPS, n, "07:40"), [n]);
  const chapter = [...CHAPTERS].reverse().find((c) => n >= c.at) ?? CHAPTERS[0];
  const photos = state.messages.filter((m) => m.kind === "photo").length;
  const done = n >= TOTAL;
  const minutesToOpen = Math.max(0, 8 * 60 - toMinutes(state.clock));

  return (
    <section
      ref={root}
      id="historia"
      aria-label="Un siniestro de punta a punta"
      className="relative h-[100svh] min-h-[640px] overflow-hidden bg-[radial-gradient(ellipse_at_30%_50%,#e8eefb,var(--color-canvas)_70%)]"
    >
      <div className="grid-lines absolute inset-0 opacity-50 [mask-image:linear-gradient(to_right,#000,transparent_60%)]" />

      <div className="relative mx-auto grid grid-cols-1 h-full max-w-[1400px] grid-rows-[auto_1fr] items-center gap-4 px-5 pt-20 pb-4 sm:px-8 lg:grid-cols-[1fr_auto_0.55fr] lg:grid-rows-1 lg:gap-10 lg:px-10 lg:py-0">
        {/* narrative */}
        <div className="st-intro relative z-10">
          <Eyebrow className="hidden sm:inline-flex">Un siniestro, de punta a punta</Eyebrow>

          <div className="flex items-end gap-4 sm:mt-6 lg:block">
            <div
              key={state.clock}
              className={cn(
                "animate-pop font-display text-[clamp(3.2rem,12vw,10.5rem)] leading-[0.82] font-bold tracking-[-0.045em] tabular-nums",
                done ? "text-brand" : "text-fg",
              )}
            >
              {state.clock}
            </div>
            <div className="pb-1 text-[13px] text-mute lg:mt-3 lg:pb-0 font-medium">
              {done ? "Denuncia cargada" : "Martes · antes de abrir"}
            </div>
          </div>

          <div key={chapter.title} className="mt-3 max-w-[460px] animate-pop lg:mt-8">
            <h3 className="font-display text-[clamp(1.4rem,2.6vw,2.4rem)] leading-tight font-semibold tracking-[-0.03em]">
              {chapter.title}
            </h3>
            <p className="mt-2 hidden text-[16px] leading-relaxed text-fg/65 sm:block lg:text-[17px]">
              {chapter.body}
            </p>
          </div>

          <ol className="mt-8 hidden max-w-[420px] space-y-2.5 lg:block">
            {STAGES.map((s) => {
              const ok = n >= s.at;
              return (
                <li key={s.label} className="flex items-center gap-3 text-[14.5px]">
                  <span
                    className={cn(
                      "grid size-5.5 place-items-center rounded-full border transition-all duration-500",
                      ok ? "border-brand bg-brand text-on-brand" : "border-fg/15 text-transparent",
                    )}
                  >
                    <Check className="size-3.5" />
                  </span>
                  <span className={cn("transition-colors duration-500", ok ? "text-fg" : "text-mute-2")}>
                    {s.label}
                    {s.photos && (
                      <span className="ml-2 font-mono text-[12px] text-mute">
                        {photos}/{PHOTO_TOTAL}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="mt-8 hidden max-w-[420px] rounded-2xl border border-fg/8 bg-canvas-3/70 p-4 lg:block">
            <div className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-fg/80">
                <Storefront className="size-4 text-coral" /> Tu oficina abre a las 8:00
              </span>
              <span className="font-mono text-[12px] text-mute">faltan {minutesToOpen} min</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-fg/8">
              <div
                className="h-full rounded-full bg-coral transition-[width] duration-700"
                style={{ width: `${((20 - minutesToOpen) / 20) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* phone */}
        <div className="relative flex h-full min-h-0 items-start justify-center lg:items-center">
          <Phone
            state={state}
            className="h-[min(620px,calc(100svh-230px))] w-[290px] sm:w-[300px] lg:h-[min(640px,calc(100svh-110px))]"
          />
          <div
            className={cn(
              "absolute bottom-6 left-1/2 z-20 w-[290px] -translate-x-1/2 transition-all duration-700 ease-out-expo lg:hidden",
              done ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-10 opacity-0",
            )}
          >
            <PanelCard />
          </div>
        </div>

        {/* panel side */}
        <div className="relative hidden lg:block">
          <p className="mb-3 text-[12.5px] text-mute font-medium">Mientras tanto, en tu panel</p>
          <div
            className={cn(
              "transition-all duration-700 ease-out-expo",
              done ? "translate-y-0 opacity-100 blur-0" : "translate-y-8 opacity-25 blur-[2px]",
            )}
          >
            <PanelCard />
          </div>
          <div
            className={cn(
              "mt-3 flex items-center gap-2 rounded-xl border border-fg/8 bg-canvas-3/70 px-3 py-2.5 text-[12.5px] transition-all delay-200 duration-700",
              done ? "opacity-100" : "opacity-0",
            )}
          >
            <EnvelopeSimple className="size-4 text-violet" />
            <span className="text-fg/80">Aviso enviado al mail del equipo</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PanelCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-fg/8 bg-canvas-2 text-fg shadow-[0_30px_80px_-20px_rgb(11_21_38/0.2)]">
      <div className="flex items-center justify-between border-b border-fg/8 px-4 py-2.5">
        <span className="text-[12px] text-fg/50 font-medium">Siniestros · nuevo</span>
        <span className="rounded-full bg-amber/25 px-2 py-0.5 text-[10.5px] font-semibold text-[#8a5a00]">Pendiente</span>
      </div>
      <div className="px-4 py-3">
        <p className="text-[15px] font-semibold tracking-tight">Lucía G. · Peugeot 208</p>
        <p className="text-[12.5px] text-fg/60">Póliza 0041 · AB123CD · hoy 07:35</p>
        <p className="mt-2 text-[12.5px] leading-snug text-fg/75">
          “Me chocaron de atrás en un semáforo. Rompieron el paragolpes y una óptica.”
        </p>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {["#2c5b3f", "#2a4766", "#2c5b3f", "#4a2f26"].map((c, i) => (
            <span key={i} className="aspect-square rounded-md" style={{ background: c }} />
          ))}
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-fg/55">
          <Paperclip className="size-3.5" /> 4 adjuntos · tarjeta, registro, tercero y daño
        </p>
      </div>
    </div>
  );
}
