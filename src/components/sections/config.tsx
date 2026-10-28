"use client";

import { useEffect, useState } from "react";
import {
  EnvelopeSimple,
  Hash,
  Phone as PhoneIcon,
  Tag,
  UsersThree,
} from "@phosphor-icons/react";
import { LogoMark } from "@/components/brand/logo";
import { rich } from "@/components/chat/phone";
import { Eyebrow, SplitReveal } from "@/components/ui/primitives";
import { useInView, useReducedMotion } from "@/lib/hooks";
import { IconBubble } from "@/components/brand/icon-bubble";
import { cn } from "@/lib/cn";

const NAMES = ["Sofía", "Tomás", "Vera", "Lola", "Benja"];
const DAYS = ["L", "M", "M", "J", "V", "S", "D"];

/** Types and erases names in the "bot name" field, like someone trying options. */
function useTypewriter(words: string[], active: boolean) {
  const reduce = useReducedMotion();
  const [state, setState] = useState({ w: 0, len: words[0].length, dir: -1 as 1 | -1, pause: 18 });
  useEffect(() => {
    if (!active || reduce) return;
    const id = window.setInterval(() => {
      setState((s) => {
        if (s.pause > 0) return { ...s, pause: s.pause - 1 };
        const word = words[s.w];
        if (s.dir === 1) {
          return s.len < word.length ? { ...s, len: s.len + 1 } : { ...s, dir: -1, pause: 22 };
        }
        if (s.len > 0) return { ...s, len: s.len - 1 };
        const next = (s.w + 1) % words.length;
        return { w: next, len: 0, dir: 1, pause: 3 };
      });
    }, 85);
    return () => window.clearInterval(id);
  }, [active, reduce, words]);
  return words[state.w].slice(0, state.len);
}

const EXTRAS = [
  { icon: PhoneIcon, t: "Varios números", d: "Uno por sucursal o por equipo." },
  { icon: Hash, t: "Varios códigos de productor", d: "Toda tu cartera, filtrable por código." },
  { icon: UsersThree, t: "Usuarios y roles", d: "Cada persona de tu equipo con su acceso." },
  { icon: Tag, t: "Planes y coberturas propios", d: "Tus precios de hogar y bolso, tus textos." },
  { icon: EnvelopeSimple, t: "Avisos por mail", d: "Cada siniestro nuevo llega también a tu casilla." },
];

export function Config() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const typed = useTypewriter(NAMES, inView);
  const name = typed || "…";

  return (
    <section id="configuracion" className="relative border-t border-fg/6 bg-canvas-2 pt-20 pb-20 sm:pt-32 sm:pb-52">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="min-w-0">
            <Eyebrow>Configuración del asistente</Eyebrow>
            <SplitReveal className="mt-5 font-display text-[clamp(2.4rem,5.4vw,5rem)] leading-[0.93] font-bold tracking-[-0.04em]">
              Con tu nombre.{" "}
              <span className="font-serif font-normal tracking-[-0.02em] text-fg/70 italic">Con tu tono.</span>
            </SplitReveal>
            <p data-reveal className="mt-6 max-w-[540px] text-[17px] leading-relaxed text-fg/65">
              El asistente se presenta con el nombre que elijas, habla como tu equipo y respeta tus horarios y
              feriados. Lo cambiás desde el panel, cuando quieras, sin pedirle nada a nadie.
            </p>
            <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              {EXTRAS.map(({ icon: Icon, t, d }) => (
                <li key={t} data-reveal className="flex gap-3">
                  <IconBubble icon={Icon} tone="soft" size={34} />
                  <span>
                    <span className="block text-[15px] font-semibold">{t}</span>
                    <span className="block text-[13.5px] text-fg/65">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div ref={ref} data-reveal className="relative min-w-0">
            <div className="rounded-[28px] border border-fg/10 bg-canvas p-2 shadow-[0_40px_100px_-40px_rgb(11_21_38/0.22)]">
              <div className="flex gap-1 overflow-x-auto px-2 pt-2 pb-3 [scrollbar-width:none]">
                {["Cuenta", "Asistente", "Horarios", "Precios", "Coberturas"].map((t) => (
                  <span
                    key={t}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-semibold",
                      t === "Asistente" ? "bg-brand text-on-brand" : "text-fg/60",
                    )}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="space-y-4 rounded-[22px] bg-canvas-3 p-5">
                <label className="block">
                  <span className="text-[12.5px] text-mute font-medium">Nombre del asistente</span>
                  <span className="mt-1.5 flex h-11 items-center rounded-xl border border-brand/40 bg-canvas px-3.5 text-[15px] font-medium text-fg shadow-[0_0_0_4px_rgb(31_79_224/0.08)]">
                    {typed}
                    <span className="ml-0.5 h-5 w-[2px] animate-blink bg-brand" />
                  </span>
                </label>
                <label className="block">
                  <span className="text-[12.5px] text-mute font-medium">Tono</span>
                  <span className="mt-1.5 block rounded-xl border border-fg/8 bg-canvas px-3.5 py-2.5 text-[13.5px] leading-snug text-fg/75">
                    Cálido y cercano, como alguien del equipo. Voseo argentino, respuestas breves.
                  </span>
                </label>
                <div>
                  <span className="text-[12.5px] text-mute font-medium">Horario de atención</span>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {DAYS.map((d, i) => (
                      <span
                        key={i}
                        className={cn(
                          "grid size-8 place-items-center rounded-lg text-[12px] font-semibold",
                          i < 5 ? "bg-fg text-canvas" : "bg-fg/6 text-mute",
                        )}
                      >
                        {d}
                      </span>
                    ))}
                    <span className="ml-1 rounded-lg border border-fg/8 px-2.5 py-1.5 font-mono text-[12px] text-fg/75">08:00 – 16:00</span>
                  </div>
                </div>
                <div>
                  <span className="text-[12.5px] text-mute font-medium">Cierres y feriados</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-[12px]">
                    {["24/12 · Nochebuena", "25/12 · Navidad", "01/01 · Año nuevo"].map((c) => (
                      <span key={c} className="rounded-lg bg-coral/12 px-2.5 py-1 text-coral">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mt-4 ml-auto w-[88%] rounded-[24px] border border-fg/10 bg-canvas-2 p-4 sm:absolute sm:-right-6 sm:-bottom-32 sm:mt-0 sm:w-[330px]">
              <p className="mb-2 text-[12px] text-mute font-medium">Vista previa · WhatsApp</p>
              <div className="flex items-start gap-2">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand">
                  <LogoMark className="h-4 w-auto text-canvas" />
                </span>
                <p className="min-h-[76px] rounded-2xl rounded-tl-md bg-canvas-4 px-3 py-2 text-[13px] leading-snug text-fg/85">
                  {rich(`¡Hola! Soy *${name}*, del equipo de *Tu Productora* 👋 Estoy para darte una mano. ¿Ya sos cliente nuestro?`)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
