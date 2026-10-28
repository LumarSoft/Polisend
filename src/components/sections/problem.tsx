"use client";

import { useRef } from "react";
import { Check } from "@phosphor-icons/react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/cn";

const MESSAGES = [
  { who: "Lucía G.", t: "07:40", m: "Choqué. ¿Qué hago? 😣", c: "#e5484d", x: 12, y: 17, r: -6 },
  { who: "Martín R.", t: "07:58", m: "¿Me mandás la tarjeta del auto? Me paró un control", c: "#7c5cfc", x: 35, y: 9, r: 4 },
  { who: "Andrea P.", t: "08:15", m: "¿Cuánto debo?", c: "#f5a524", x: 64, y: 8, r: -3 },
  { who: "Jorge L.", t: "09:02", m: "Me rechazaron el débito de la cuota", c: "#12b76a", x: 88, y: 18, r: 6 },
  { who: "Sofía M.", t: "09:47", m: "¿Cuánto sale asegurar una moto?", c: "#1f4fe0", x: 9, y: 43, r: 3 },
  { who: "Diego F.", t: "10:30", m: "Necesito el certificado de cobertura para el laburo", c: "#e5484d", x: 91, y: 44, r: -5 },
  { who: "Carla V.", t: "11:12", m: "¿Hasta cuándo tengo cobertura?", c: "#7c5cfc", x: 13, y: 71, r: -4 },
  { who: "Nico A.", t: "12:41", m: "Me robaron la bici 😩", c: "#f5a524", x: 87, y: 70, r: 4 },
  { who: "Paula S.", t: "13:05", m: "¿Tienen seguro para un local?", c: "#12b76a", x: 27, y: 90, r: 5 },
  { who: "Ramiro T.", t: "16:10", m: "¿Están atendiendo?", c: "#1f4fe0", x: 50, y: 93, r: -3 },
  { who: "Vale C.", t: "18:47", m: "Me quedé en la ruta, ¿número de grúa?", c: "#e5484d", x: 73, y: 89, r: 6 },
  { who: "Hernán B.", t: "22:15", m: "Pasame el cupón de pago porfa", c: "#7c5cfc", x: 94, y: 93, r: -6 },
  { who: "Flor D.", t: "Sáb 10:20", m: "¿Cubre granizo mi póliza?", c: "#f5a524", x: 31, y: 34, r: -8 },
  { who: "Lucas O.", t: "Sáb 19:02", m: "Quiero cambiar de cobertura", c: "#12b76a", x: 69, y: 31, r: 7 },
  { who: "Mica E.", t: "Dom 11:34", m: "¿Me pueden llamar el lunes?", c: "#1f4fe0", x: 30, y: 66, r: 5 },
  { who: "Gaby N.", t: "Dom 23:58", m: "Hola?? 😕", c: "#e5484d", x: 70, y: 65, r: -5 },
];

export function Problem() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const cards = gsap.utils.toArray<HTMLElement>(".pb-card");
        const counter = { n: 0 };
        const num = root.current!.querySelector<HTMLElement>(".pb-count")!;
        const render = () => {
          num.textContent = String(Math.round(counter.n)).padStart(2, "0");
        };
        render();

        // The headline is already up when the section arrives, so pinning
        // never shows an empty screen.
        gsap.from(".pb-a > *", {
          y: 50,
          autoAlpha: 0,
          stagger: 0.1,
          duration: 0.9,
          ease: "expo.out",
          scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
        });

        // Messages pile up while the section is pinned, driven by the scroll.
        const tl = gsap.timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=250%",
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });

        tl.from(
          cards,
          {
            y: () => -window.innerHeight * 0.35,
            scale: 1.25,
            autoAlpha: 0,
            rotate: (i) => (i % 2 ? 18 : -18),
            stagger: 0.16,
            duration: 0.6,
            ease: "back.out(1.4)",
          },
          0,
        )
          .to(counter, { n: cards.length, duration: cards.length * 0.16 + 0.4, ease: "none", onUpdate: render }, 0)
          .to(".pb-a", { y: -50, autoAlpha: 0, duration: 0.5 }, "+=0.3")
          .fromTo(".pb-b > *", { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.12, duration: 0.5 }, "<0.2")
          .to(".pb-check", { scale: 1, autoAlpha: 1, stagger: 0.06, duration: 0.3, ease: "back.out(2.5)" }, "<")
          .to(cards, { borderColor: "rgb(31 79 224 / 0.45)", stagger: 0.06, duration: 0.3 }, "<")
          .to(counter, { n: 0, duration: cards.length * 0.06 + 0.3, ease: "none", onUpdate: render }, "<")
          .to(".pb-count-wrap", { color: "#1f4fe0", duration: 0.2 }, ">-0.1")
          .to(".pb-label", { autoAlpha: 0, duration: 0.15 }, "<")
          .to(".pb-label-done", { autoAlpha: 1, duration: 0.15 }, "<")
          .to(
            cards,
            {
              x: (_i, el: HTMLElement) =>
                root.current!.offsetWidth * (0.5 - Number(el.dataset.x) / 100),
              y: (_i, el: HTMLElement) =>
                root.current!.offsetHeight * (0.5 - Number(el.dataset.y) / 100),
              rotate: 0,
              scale: 0.2,
              autoAlpha: 0,
              stagger: { each: 0.03, from: "random" },
              duration: 0.7,
              ease: "power3.in",
            },
            "+=0.25",
          )
          .fromTo(".pb-burst", { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: "expo.out" }, ">-0.25")
          .to({}, { duration: 0.3 });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="problema"
      aria-label="El problema"
      className="relative h-[100svh] min-h-[620px] overflow-hidden"
    >
      <div className="absolute inset-0">
        {MESSAGES.map((msg, i) => (
          <article
            key={msg.who}
            data-x={msg.x}
            data-y={msg.y}
            className={cn(
              "pb-card absolute w-[170px] motion-safe:invisible -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-fg/8 bg-canvas-2 p-2.5 shadow-[0_20px_50px_-20px_rgb(11_21_38/0.22)] sm:w-[220px] sm:p-3",
              i >= 12 && "hidden sm:block",
            )}
            style={{ left: `${msg.x}%`, top: `${msg.y}%`, transform: `rotate(${msg.r}deg)` }}
          >
            <div className="flex items-center gap-2">
              <span
                className="grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold text-canvas"
                style={{ background: msg.c }}
              >
                {msg.who[0]}
              </span>
              <span className="truncate text-[12px] font-semibold text-fg/90">{msg.who}</span>
              <span className="ml-auto font-mono text-[10px] text-mute">{msg.t}</span>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-snug text-fg/75 sm:text-[13.5px]">{msg.m}</p>
            <span className="pb-check invisible absolute -top-2 -right-2 grid size-6 scale-0 place-items-center rounded-full bg-brand text-on-brand shadow-[0_0_20px_rgb(31_79_224/0.6)]">
              <Check className="size-3.5" />
            </span>
          </article>
        ))}
      </div>

      {/* keeps the headline legible over the pile */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_48%_40%_at_50%_50%,var(--color-canvas)_35%,transparent_100%)]" />

      <div className="pb-burst pointer-events-none invisible absolute top-1/2 left-1/2 size-[46vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(31_79_224/0.35),transparent_65%)]" />

      <div className="relative z-10 grid h-full place-items-center px-5 text-center">
        <div className="pb-a col-start-1 row-start-1">
          <p className="mb-5 text-[13px] text-mute font-medium">
            Un día cualquiera en tu productora
          </p>
          <h2 className="font-display text-[clamp(2.4rem,6.4vw,6rem)] leading-[0.92] font-bold tracking-[-0.04em]">
            Cientos de asegurados.
            <br />
            Un solo WhatsApp.
          </h2>
          <p className="mt-4 font-serif text-[clamp(1.6rem,3.6vw,3.3rem)] text-fg/70 italic">
            Y del otro lado, una persona.
          </p>
        </div>
        <div className="pb-b col-start-1 row-start-1 motion-reduce:hidden [&>*]:invisible">
          <p className="mb-5 text-[13px] text-brand font-medium">Con Polisend</p>
          <h2 className="font-display text-[clamp(2.4rem,6.4vw,6rem)] leading-[0.92] font-bold tracking-[-0.04em]">
            Las contesta <span className="text-brand">todas.</span>
          </h2>
          <p className="mt-4 font-serif text-[clamp(1.6rem,3.6vw,3.3rem)] text-fg/70 italic">
            A la vez. A cualquier hora.
          </p>
        </div>
      </div>

      <div className="pb-count-wrap absolute bottom-6 left-5 z-20 rounded-2xl bg-canvas/85 px-4 py-3 text-coral backdrop-blur sm:bottom-10 sm:left-10 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="relative text-[12.5px] font-medium">
          <span className="pb-label">Sin responder</span>
          <span className="pb-label-done invisible absolute inset-0">Pendientes</span>
        </div>
        <div className="pb-count font-display text-[clamp(3rem,7vw,6rem)] leading-none font-bold tracking-tight tabular-nums">
          {MESSAGES.length}
        </div>
      </div>
    </section>
  );
}
