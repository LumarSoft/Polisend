"use client";

import { useRef } from "react";
import {
  ClockCounterClockwise,
  CopySimple,
  Gauge,
  Lightning,
  ListNumbers,
  MoonStars,
  Question,
  Sparkle,
} from "@phosphor-icons/react";
import { IconBubble } from "@/components/brand/icon-bubble";
import { Eyebrow, SplitReveal } from "@/components/ui/primitives";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

const SAFEGUARDS = [
  { icon: CopySimple, t: "Nunca contesta dos veces", d: "Si WhatsApp reenvía un mensaje, Polisend lo reconoce y lo descarta." },
  { icon: ListNumbers, t: "Respeta el orden", d: "Cada conversación se procesa en fila: ninguna respuesta se adelanta a otra." },
  { icon: Question, t: "Si no entiende, no insiste", d: "A la segunda vez ofrece volver al menú o hablar con una persona." },
  { icon: ClockCounterClockwise, t: "Retoma donde quedó", d: "El paso de cada charla se guarda. Un corte o un reinicio no la pierde." },
  { icon: MoonStars, t: "Cierra lo que quedó colgado", d: "Avisa por inactividad, con tus horarios, y deja la puerta abierta." },
  { icon: Gauge, t: "Gasto bajo control", d: "Tope mensual por número. Si se alcanza, sigue atendiendo con los flujos guiados." },
];

/** Rounded so server and client trig output render identical attributes. */
const r2 = (n: number) => Math.round(n * 100) / 100;

const A = "M150 180 H360";
const B = "M480 180 C600 180 620 84 740 84";
const C = "M480 180 C600 180 620 276 740 276";

function EnginesDiagram() {
  return (
    <svg viewBox="0 0 1000 360" className="h-auto w-full" aria-hidden>
      <defs>
        <linearGradient id="fadeLine" gradientUnits="userSpaceOnUse" x1="150" y1="0" x2="740" y2="0">
          <stop offset="0" stopColor="#1f4fe0" stopOpacity="0.15" />
          <stop offset="1" stopColor="#1f4fe0" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      {[A, B, C].map((d) => (
        <path key={d} d={d} fill="none" stroke="url(#fadeLine)" strokeWidth="2" strokeDasharray="6 8" className="animate-[dash_1.2s_linear_infinite]" />
      ))}
      {[0, 0.8, 1.6].map((b) => (
        <circle key={b} r="6" fill="#0b1526">
          <animateMotion dur="2.4s" begin={`${b}s`} repeatCount="indefinite" path={A} />
        </circle>
      ))}
      {[0.3, 1.5].map((b) => (
        <circle key={`b${b}`} r="7" fill="#1f4fe0">
          <animateMotion dur="1.6s" begin={`${b}s`} repeatCount="indefinite" path={B} />
        </circle>
      ))}
      <circle r="7" fill="#7c5cfc">
        <animateMotion dur="2.6s" begin="0.9s" repeatCount="indefinite" path={C} />
      </circle>

      <g>
        <rect x="20" y="146" width="130" height="68" rx="18" fill="#ffffff" stroke="rgb(11 21 38 / .12)" />
        <text x="85" y="176" textAnchor="middle" fill="#66728a" fontSize="14">Entra</text>
        <text x="85" y="198" textAnchor="middle" fill="#0b1526" fontSize="16" fontWeight="600">un mensaje</text>
      </g>
      <g>
        <circle cx="420" cy="180" r="62" fill="#1f4fe0" />
        <circle cx="420" cy="180" r="62" fill="none" stroke="#1f4fe0" strokeOpacity=".35" strokeWidth="2" className="origin-[420px_180px] animate-pulse-ring" />
        <text x="420" y="176" textAnchor="middle" fill="#ffffff" fontSize="20" fontWeight="700" letterSpacing="-0.8" style={{ fontFamily: "var(--font-bricolage)" }}>polisend</text>
        <text x="420" y="198" textAnchor="middle" fill="#ffffff" fillOpacity=".6" fontSize="13">decide</text>
      </g>
      <g>
        <rect x="740" y="44" width="250" height="80" rx="20" fill="#ffffff" stroke="#1f4fe0" strokeOpacity=".5" />
        <text x="762" y="78" fill="#1f4fe0" fontSize="17" fontWeight="700">⚡ Flujo guiado</text>
        <text x="762" y="102" fill="#66728a" fontSize="13">siniestros · pagos · documentos</text>
      </g>
      <g>
        <rect x="740" y="236" width="250" height="80" rx="20" fill="#ffffff" stroke="#7c5cfc" strokeOpacity=".5" />
        <text x="762" y="270" fill="#7c5cfc" fontSize="17" fontWeight="700">✦ IA conversacional</text>
        <text x="762" y="294" fill="#66728a" fontSize="13">cotizar · dudas en lenguaje libre</text>
      </g>
    </svg>
  );
}

function Ring() {
  const R = 132;
  const C = 2 * Math.PI * R;
  const office = C * (8 / 24);
  return (
    <svg viewBox="0 0 340 340" className="h-auto w-full max-w-[420px]" aria-hidden>
      <g transform="rotate(-90 170 170)">
        <circle cx="170" cy="170" r={R} fill="none" stroke="rgb(11 21 38 / .07)" strokeWidth="22" />
        <circle
          className="ring-bot"
          cx="170"
          cy="170"
          r={R}
          fill="none"
          stroke="#1f4fe0"
          strokeWidth="22"
          strokeDasharray={C}
          strokeDashoffset="0"
        />
        <circle
          cx="170"
          cy="170"
          r={R}
          fill="none"
          stroke="#0b1526"
          strokeOpacity=".85"
          strokeWidth="22"
          strokeDasharray={`${office} ${C}`}
          strokeDashoffset={-C * (8 / 24)}
        />
      </g>
      {Array.from({ length: 24 }, (_, h) => {
        const a = (h / 24) * 2 * Math.PI - Math.PI / 2;
        const r1 = R - 22;
        const rr = R - (h % 6 === 0 ? 34 : 28);
        return (
          <line
            key={h}
            x1={r2(170 + Math.cos(a) * r1)}
            y1={r2(170 + Math.sin(a) * r1)}
            x2={r2(170 + Math.cos(a) * rr)}
            y2={r2(170 + Math.sin(a) * rr)}
            stroke="rgb(11 21 38 / .25)"
          />
        );
      })}
      {[
        { h: 0, l: "00" },
        { h: 6, l: "06" },
        { h: 12, l: "12" },
        { h: 18, l: "18" },
      ].map(({ h, l }) => {
        const a = (h / 24) * 2 * Math.PI - Math.PI / 2;
        return (
          <text key={l} x={r2(170 + Math.cos(a) * 88)} y={r2(174 + Math.sin(a) * 88)} textAnchor="middle" fill="#66728a" fontSize="11" fontFamily="var(--font-geist-mono)">
            {l}
          </text>
        );
      })}
      <g className="ring-hand">
        <circle cx="170" cy={170 - R} r="9" fill="#ffffff" stroke="#1f4fe0" strokeWidth="3" />
      </g>
      <text x="170" y="178" textAnchor="middle" fill="#0b1526" fontSize="54" fontWeight="700" letterSpacing="-3">24 h</text>
      <text x="170" y="204" textAnchor="middle" fill="#66728a" fontSize="13">7 días · feriados</text>
    </svg>
  );
}

export function Speed() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const ring = root.current!.querySelector<SVGCircleElement>(".ring-bot")!;
        const len = Number(ring.getAttribute("stroke-dasharray"));
        gsap.fromTo(
          ring,
          { strokeDashoffset: len },
          {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: { trigger: ".ring-wrap", start: "top 80%", end: "center 45%", scrub: 1 },
          },
        );
        gsap.to(".ring-hand", { rotation: 360, svgOrigin: "170 170", duration: 12, ease: "none", repeat: -1 });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="velocidad" className="relative overflow-hidden border-y border-fg/6 bg-canvas-2 py-20 sm:py-32">
      <div className="absolute top-0 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgb(124_92_252/0.08),transparent_65%)]" />
      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
        <div className="max-w-[900px]">
          <Eyebrow>Velocidad</Eyebrow>
          <SplitReveal className="mt-5 font-display text-[clamp(2.6rem,6.4vw,6rem)] leading-[0.92] font-bold tracking-[-0.04em]">
            Responde en segundos.{" "}
            <span className="font-serif font-normal tracking-[-0.02em] text-fg/70 italic">Y no inventa nada.</span>
          </SplitReveal>
          <p data-reveal className="mt-6 max-w-[640px] text-[17px] leading-relaxed text-fg/65">
            Polisend tiene dos motores y sabe cuál usar en cada momento. Lo crítico corre por flujos guiados: instantáneos
            y exactos. La inteligencia artificial entra solo donde suma.
          </p>
        </div>

        <div data-reveal className="mt-14 hidden rounded-[32px] border border-fg/8 bg-canvas/60 p-6 md:block lg:p-10">
          <EnginesDiagram />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div data-reveal className="rounded-[28px] border border-brand/25 bg-[linear-gradient(160deg,rgb(31_79_224/0.08),transparent_60%)] p-7">
            <div className="flex items-center gap-2 text-[13px] text-brand font-medium">
              <Lightning className="size-4" /> Flujo guiado
            </div>
            <h3 className="mt-3 font-display text-[26px] leading-tight font-semibold tracking-[-0.03em]">
              Siniestros, pagos, documentos e identificación.
            </h3>
            <p className="mt-2 text-[15.5px] leading-relaxed text-fg/65">
              Botones y listas que no pasan por la IA: la respuesta sale al instante, es siempre la misma y usa los datos
              reales de la póliza. Nada que interpretar, nada que alucinar.
            </p>
          </div>
          <div data-reveal className="rounded-[28px] border border-violet/25 bg-[linear-gradient(160deg,rgb(124_92_252/0.08),transparent_60%)] p-7">
            <div className="flex items-center gap-2 text-[13px] text-violet font-medium">
              <Sparkle className="size-4" /> IA conversacional
            </div>
            <h3 className="mt-3 font-display text-[26px] leading-tight font-semibold tracking-[-0.03em]">
              Cotizar y responder dudas, como lo haría tu equipo.
            </h3>
            <p className="mt-2 text-[15.5px] leading-relaxed text-fg/65">
              Habla con voseo y con tu tono. Tiene control estricto: no se va de tema, no da precios que no salgan de la
              compañía y, ante la duda, deriva a un asesor.
            </p>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="ring-wrap mx-auto w-full max-w-[420px]">
            <Ring />
            <div className="mt-6 flex justify-center gap-6 text-[13px] text-mute font-medium">
              <span className="flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-fg/85" /> Tu oficina · 8 a 16 h</span>
              <span className="flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-brand" /> Polisend · 24 h</span>
            </div>
          </div>
          <div>
            <SplitReveal as="h3" className="font-display text-[clamp(2rem,4.2vw,3.8rem)] leading-[0.98] font-bold tracking-[-0.035em]">
              Tu oficina atiende 8 horas.{" "}
              <span className="text-brand">Polisend, 24.</span>
            </SplitReveal>
            <p data-reveal className="mt-5 max-w-[560px] text-[17px] leading-relaxed text-fg/65">
              Los choques no avisan, las cuotas vencen un domingo y la tarjeta del auto se pide en un control a las 23.
              Tus asegurados no escriben en horario de oficina: ahora tampoco tienen que esperarlo.
            </p>
            <ul className="mt-10 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              {SAFEGUARDS.map(({ icon: Icon, t, d }) => (
                <li key={t} data-reveal className="flex gap-3.5">
                  <IconBubble icon={Icon} tone="soft" size={38} />
                  <span>
                    <span className="block text-[15.5px] font-semibold text-fg">{t}</span>
                    <span className="mt-0.5 block text-[14px] leading-snug text-fg/55">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
