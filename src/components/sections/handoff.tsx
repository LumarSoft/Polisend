"use client";

import { useRef } from "react";
import {
  Hand,
  MagnifyingGlass,
  PaperPlaneRight,
  Robot,
  User,
} from "@phosphor-icons/react";
import { gsap, MOTION_OK, SplitText, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/cn";

const CONVERSATIONS = [
  { n: "Jorge P.", m: "Quiero hablar con alguien", s: "Pendiente", tone: "bg-coral/15 text-coral", active: true },
  { n: "Lucía G.", m: "listo", s: "Bot", tone: "bg-brand/15 text-[#1840b8]" },
  { n: "Ana M.", m: "Gracias Martina!!", s: "Tomada", tone: "bg-violet/20 text-[#5b3fd6]" },
  { n: "Carlos B.", m: "AB987CD", s: "Bot", tone: "bg-brand/15 text-[#1840b8]" },
];

function Inbox() {
  return (
    <div className="overflow-hidden rounded-[22px] bg-canvas text-fg shadow-[0_40px_100px_-30px_rgb(11_21_38/0.22)]">
      <div className="flex items-center gap-2 border-b border-fg/8 px-4 py-3">
        <span className="font-display text-[15px] font-semibold tracking-tight">Inbox</span>
        <span className="ml-2 flex gap-1 text-[12px] font-medium">
          <span className="rounded-full bg-fg px-2 py-0.5 text-canvas">Todas</span>
          <span className="rounded-full px-2 py-0.5 text-fg/50">Pendientes · 1</span>
          <span className="rounded-full px-2 py-0.5 text-fg/50">Tomadas</span>
        </span>
        <MagnifyingGlass className="ml-auto size-4 text-fg/40" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr]">
        <ul className="hidden border-r border-fg/8 sm:block">
          {CONVERSATIONS.map((c) => (
            <li key={c.n} className={cn("border-b border-fg/6 px-3.5 py-2.5", c.active && "bg-fg/[0.045]")}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold">{c.n}</span>
                <span className={cn("rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold", c.tone)}>{c.s}</span>
              </div>
              <p className="truncate text-[11.5px] text-fg/55">{c.m}</p>
            </li>
          ))}
        </ul>
        <div className="flex min-h-[220px] flex-col sm:min-h-[290px]">
          <div className="flex items-center gap-2 border-b border-fg/8 px-4 py-2.5">
            <span className="grid size-7 place-items-center rounded-full bg-fg text-[11px] font-bold text-canvas">J</span>
            <span className="text-[13px] font-semibold">Jorge P.</span>
            <span className="ho-taken relative ml-auto inline-grid rounded-full bg-fg px-3 py-1.5 text-[11px] font-semibold text-canvas">
              <span className="ho-take-a col-start-1 row-start-1 inline-flex items-center gap-1.5">
                <Hand className="size-3.5" /> Tomar conversación
              </span>
              <span className="ho-take-b invisible col-start-1 row-start-1 inline-flex items-center gap-1.5">
                <User className="size-3.5" /> Tomada por Martina
              </span>
            </span>
          </div>
          <div className="flex flex-1 flex-col justify-end gap-1.5 bg-[#eef2f7] px-3 py-3 text-[12px]">
            <p className="max-w-[80%] self-start rounded-xl rounded-tl-sm bg-white px-2.5 py-1.5">Quiero hablar con alguien 🙏</p>
            <p className="max-w-[80%] self-end rounded-xl rounded-tr-sm bg-[#dbe5ff] px-2.5 py-1.5">
              ¡Dale! Le aviso a alguien del equipo y te escribe por acá. <span className="text-[9px] text-fg/40">· bot</span>
            </p>
            <p className="ho-event mx-auto my-1 rounded-full bg-fg/8 px-2.5 py-0.5 text-[11.5px] text-fg/60 font-medium">
              Martina tomó la conversación · bot en pausa
            </p>
            <p className="ho-human max-w-[80%] self-end rounded-xl rounded-tr-sm bg-fg px-2.5 py-1.5 text-canvas">
              Hola Jorge, soy Martina 🙂 Ya tengo tu historial abierto, ¿lo vemos?
            </p>
          </div>
          <div className="flex items-center gap-2 border-t border-fg/8 px-3 py-2.5">
            <span className="flex-1 rounded-full bg-fg/6 px-3 py-1.5 text-[12px] text-fg/40">Escribí un mensaje…</span>
            <span className="grid size-7 place-items-center rounded-full bg-fg text-canvas">
              <PaperPlaneRight className="size-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Handoff() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const split = SplitText.create(".ho-quiet", { type: "chars", mask: "chars" });
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: { trigger: root.current, start: "top top", end: "+=240%", pin: true, scrub: 0.8 },
        });
        tl.from(".ho-ask > *", { y: 50, autoAlpha: 0, stagger: 0.15, duration: 0.5 })
          .from(".ho-dots", { scale: 0.4, autoAlpha: 0, duration: 0.3 }, "+=0.1")
          .to(".ho-dots span", { y: 0, scale: 0.6, opacity: 0.25, stagger: 0.05, duration: 0.4 }, "+=0.5")
          .to(".ho-dots", { autoAlpha: 0, duration: 0.3 })
          .to(".ho-ask", { autoAlpha: 0, y: -40, duration: 0.4 }, "<")
          .set(".ho-quiet-wrap", { autoAlpha: 1 })
          .from(split.chars, { yPercent: 110, stagger: 0.025, duration: 0.5 }, "<0.1")
          .to(".ho-quiet-wrap", { y: () => -window.innerHeight * 0.3, scale: 0.55, duration: 0.6 }, "+=0.5")
          .from(".ho-panel", { y: 140, autoAlpha: 0, duration: 0.6 }, "<0.1")
          .to(".ho-taken", { backgroundColor: "#1f4fe0", color: "#ffffff", duration: 0.2 }, "+=0.1")
          .to(".ho-take-a", { autoAlpha: 0, duration: 0.1 }, "<")
          .to(".ho-take-b", { autoAlpha: 1, duration: 0.1 }, "<")
          .from(".ho-event", { autoAlpha: 0, scale: 0.8, duration: 0.25 })
          .from(".ho-human", { autoAlpha: 0, y: 20, duration: 0.3 })
          .from(".ho-copy", { autoAlpha: 0, y: 20, duration: 0.3 }, "<")
          .to({}, { duration: 0.4 });
        return () => split.revert();
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="asesor"
      aria-label="Derivación a una persona"
      className="relative h-[100svh] min-h-[640px] overflow-hidden bg-fg text-canvas motion-reduce:h-auto motion-reduce:py-24"
    >
      <div className="absolute inset-0 grid place-items-center px-5 motion-reduce:hidden">
        <div className="ho-ask text-center">
          <p className="font-display text-[clamp(2rem,5vw,4.6rem)] leading-[0.98] font-bold tracking-[-0.035em]">
            Y cuando tu cliente pide <span className="font-serif font-normal text-canvas/75 italic">una persona</span>…
          </p>
          <p className="mx-auto mt-8 w-fit rounded-2xl rounded-tr-md bg-brand px-4 py-2.5 text-[17px] font-medium text-on-brand">
            Quiero hablar con alguien 🙏
          </p>
          <div className="ho-dots mx-auto mt-6 flex w-fit items-center gap-2.5 rounded-3xl rounded-tl-md bg-fg-4 px-6 py-5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-4 animate-blink rounded-full bg-canvas/80" style={{ animationDelay: `${i * 0.16}s` }} />
            ))}
          </div>
        </div>
      </div>

      <div className="ho-quiet-wrap invisible absolute inset-0 grid place-items-center px-5 motion-reduce:visible motion-reduce:relative motion-reduce:pb-10">
        <p className="ho-quiet text-center font-display text-[clamp(3.4rem,11vw,10rem)] leading-[0.9] font-bold tracking-[-0.045em]">
          el bot se <span className="text-brand">calla.</span>
        </p>
      </div>

      <div className="ho-panel absolute inset-x-0 bottom-0 motion-reduce:relative mx-auto grid grid-cols-1 max-w-[1100px] items-end gap-6 px-5 pb-8 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10 lg:pb-14">
        <div className="ho-copy order-2 lg:order-1">
          <div className="mb-4 flex items-center gap-3 text-[13px] text-mute font-medium">
            <span className="flex items-center gap-1.5"><Robot className="size-4 text-brand" /> Bot en pausa</span>
            <span className="h-px w-8 bg-white/20" />
            <span className="flex items-center gap-1.5"><User className="size-4 text-violet" /> Atiende tu equipo</span>
          </div>
          <p className="text-[16.5px] leading-relaxed text-canvas/70">
            Tu equipo toma la charla desde el <b className="text-canvas">inbox del panel</b>, con todo el historial a la vista.
            Cuando la libera, el bot vuelve a atender. Cada pedido de asesor te llega como novedad, para que nadie quede
            esperando.
          </p>
        </div>
        <div className="order-1 lg:order-2">
          <Inbox />
        </div>
      </div>
    </section>
  );
}
