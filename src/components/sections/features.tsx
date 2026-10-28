"use client";

import type { ComponentType, PointerEvent, ReactNode } from "react";
import type { IconProps } from "@phosphor-icons/react";
import {
  Check,
  FilePdf,
  Headset,
  Lifebuoy,
  Lightning,
  MoonStars,
  Receipt,
  ShieldWarning,
  UserPlus,
} from "@phosphor-icons/react";
import { Eyebrow, SplitReveal } from "@/components/ui/primitives";
import { useInView, useTicker } from "@/lib/hooks";
import { IconBubble } from "@/components/brand/icon-bubble";
import { cn } from "@/lib/cn";

function Card({
  className,
  icon,
  kicker,
  title,
  children,
  visual,
}: {
  className?: string;
  icon: ComponentType<IconProps>;
  kicker: string;
  title: ReactNode;
  children: ReactNode;
  visual: ReactNode;
}) {
  const onMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <article
      data-reveal
      onPointerMove={onMove}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[28px] border border-fg/8 bg-canvas-2 p-6 transition-colors duration-500 hover:border-brand/30 sm:p-7",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(420px_circle_at_var(--mx)_var(--my),rgb(31_79_224/0.09),transparent_60%)]" />
      <div className="relative flex items-center gap-3 text-[14px] font-medium text-fg/55">
        <IconBubble icon={icon} size={38} />
        {kicker}
      </div>
      <h3 className="relative mt-4 font-display text-[clamp(1.35rem,2vw,1.75rem)] leading-[1.08] font-semibold tracking-[-0.03em] text-balance">
        {title}
      </h3>
      <p className="relative mt-2.5 text-[15px] leading-relaxed text-fg/60">{children}</p>
      <div className="relative mt-6 flex flex-1 items-end">{visual}</div>
    </article>
  );
}

/* ─── visuals ─────────────────────────────────────────────── */

const CLAIM_STEPS = ["Póliza", "Fecha", "Qué pasó", "Confirmar", "Tarjeta", "Registro", "Tercero", "Daños"];

function ClaimVisual() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const t = useTicker(CLAIM_STEPS.length + 5, 700, inView);
  const states = [
    { k: "Pendiente", c: "bg-amber/25 text-[#8a5a00]" },
    { k: "En proceso", c: "bg-violet/25 text-[#5b3fd6]" },
    { k: "Resuelto", c: "bg-mint/25 text-[#0f6b45]" },
  ];
  const stage = Math.max(0, Math.min(2, t - CLAIM_STEPS.length));
  const created = t >= CLAIM_STEPS.length;
  return (
    <div ref={ref} className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap gap-1.5">
        {CLAIM_STEPS.map((s, i) => (
          <span
            key={s}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] transition-all duration-500",
              t > i ? "border-brand/40 bg-brand/10 text-fg" : "border-fg/8 text-mute-2",
            )}
          >
            <Check className={cn("size-3.5 transition-all duration-500", t > i ? "text-brand" : "text-transparent")} />
            {s}
          </span>
        ))}
      </div>
      <div
        className={cn(
          "rounded-2xl bg-canvas p-4 text-fg transition-all duration-700 ease-out-expo sm:p-5",
          created ? "translate-y-0 opacity-100" : "translate-y-4 opacity-40",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] text-fg/50 font-medium">Panel · Siniestro #1043</p>
          <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors duration-500", states[stage].c)}>
            {states[stage].k}
          </span>
        </div>
        <p className="mt-2 text-[16px] font-semibold tracking-tight">Lucía G. · Peugeot 208</p>
        <p className="text-[12.5px] text-fg/55">Choque trasero · hoy 07:35 · con tercero</p>
        <div className="mt-4 flex items-center gap-1">
          {states.map((st, i) => (
            <div key={st.k} className="flex flex-1 items-center gap-1">
              <span className={cn("size-2.5 shrink-0 rounded-full transition-colors duration-500", created && i <= stage ? "bg-fg" : "bg-fg/15")} />
              {i < states.length - 1 && (
                <span className="h-0.5 flex-1 overflow-hidden rounded-full bg-fg/10">
                  <span className={cn("block h-full bg-fg transition-[width] duration-700", created && i < stage ? "w-full" : "w-0")} />
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[10.5px] text-fg/45">
          {states.map((st) => (
            <span key={st.k}>{st.k}</span>
          ))}
        </div>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className="flex -space-x-4">
          {["#2c5b3f", "#2a4766", "#2c5b3f", "#4a2f26"].map((c, i) => (
            <span
              key={i}
              className={cn(
                "h-16 w-13 rounded-xl border-2 border-canvas-2 shadow-xl transition-all duration-700 ease-out-expo sm:h-20 sm:w-16",
                t > 4 + Math.min(i, 3) ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
              )}
              style={{ background: `linear-gradient(140deg, ${c}, #111)`, rotate: `${(i - 1.5) * 5}deg` }}
            />
          ))}
        </div>
        <p className="pb-1 text-right font-mono text-[11px] leading-relaxed text-mute">
          4 adjuntos
          <br />
          aviso por mail ✓
        </p>
      </div>
    </div>
  );
}

function PaymentsVisual() {
  const rows = [
    { c: "Cuota 08/12", s: "Vencida", tone: "text-coral bg-coral/12", a: "$ 46.900" },
    { c: "Cuota 09/12", s: "Débito rechazado", tone: "text-coral bg-coral/12", a: "$ 46.900" },
    { c: "Cuota 10/12", s: "Pendiente · 05/11", tone: "text-amber bg-amber/12", a: "$ 48.300" },
  ];
  return (
    <div className="w-full rounded-2xl border border-fg/8 bg-canvas-3/60 p-3">
      {rows.map((r) => (
        <div key={r.c} className="flex items-center gap-3 border-b border-fg/6 py-2 last:border-0">
          <span className="min-w-0">
            <span className="block text-[12.5px] text-fg/85">{r.c}</span>
            <span className={cn("mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap", r.tone)}>{r.s}</span>
          </span>
          <span className="ml-auto font-mono text-[12.5px] whitespace-nowrap text-fg/80">{r.a}</span>
        </div>
      ))}
      <div className="mt-1 flex items-center justify-between pt-1 text-[13px]">
        <span className="text-mute">Total adeudado</span>
        <span className="font-mono font-semibold whitespace-nowrap text-brand">$ 142.100</span>
      </div>
    </div>
  );
}

function DocsVisual() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const t = useTicker(4, 900, inView);
  const docs = ["Tarjeta de circulación", "Certificado de cobertura", "Cupón de pago"];
  return (
    <div ref={ref} className="w-full space-y-2">
      {docs.map((d, i) => (
        <div
          key={d}
          className={cn(
            "flex items-center gap-3 rounded-xl border border-fg/8 bg-canvas-3/70 p-2.5 transition-all duration-700 ease-out-expo",
            t > i ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0",
          )}
        >
          <span className="grid size-8 place-items-center rounded-lg bg-coral/90 text-canvas">
            <FilePdf className="size-4" />
          </span>
          <span className="text-[13px] text-fg/85">{d}</span>
          <span className="ml-auto font-mono text-[10px] text-mute">PDF</span>
        </div>
      ))}
    </div>
  );
}

const QUOTE = [
  { n: "Responsabilidad Civil", p: 38900 },
  { n: "Todo Total", p: 52600 },
  { n: "Terceros Completo", p: 67300 },
  { n: "Todo Riesgo", p: 118500 },
];

function QuoteVisual() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const t = useTicker(6, 1100, inView);
  const max = QUOTE[QUOTE.length - 1].p;
  return (
    <div ref={ref} className="w-full">
      <div className="mb-4 flex flex-wrap gap-1.5 font-mono text-[11px]">
        {["Fiat Cronos 1.3 Drive", "2021", "CP 2000", "Sin GNC"].map((x) => (
          <span key={x} className="rounded-md border border-fg/10 bg-canvas-3 px-2 py-1 text-fg/70">
            {x}
          </span>
        ))}
      </div>
      <ul className="space-y-2.5">
        {QUOTE.map((q, i) => (
          <li key={q.n} className="grid grid-cols-[130px_1fr_auto] items-center gap-3 text-[12.5px] sm:grid-cols-[150px_1fr_auto]">
            <span className="truncate text-fg/75">{q.n}</span>
            <span className="h-2.5 overflow-hidden rounded-full bg-fg/6">
              <span
                className="block h-full rounded-full bg-brand transition-[width] duration-1000 ease-out-expo"
                style={{ width: t > i ? `${(q.p / max) * 100}%` : "0%", transitionDelay: `${i * 90}ms` }}
              />
            </span>
            <span className={cn("font-mono text-fg transition-opacity duration-500", t > i ? "opacity-100" : "opacity-0")}>
              $ {q.p.toLocaleString("es-AR")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const RAMOS = ["🚗 Auto", "🏍️ Moto", "🚲 Bici / Monopatín", "👜 Bolso protegido", "🏪 Comercio", "🏠 Hogar", "🧑 Personas", "⚕️ Praxis"];

function LeadsVisual() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const t = useTicker(RAMOS.length, 1000, inView);
  return (
    <div ref={ref} className="w-full">
      <div className="flex flex-wrap gap-1.5">
        {RAMOS.map((r, i) => (
          <span
            key={r}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[12px] transition-all duration-500",
              t === i ? "border-brand bg-brand text-on-brand" : "border-fg/10 text-fg/65",
            )}
          >
            {r}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-fg px-3 py-2 text-canvas">
        <UserPlus className="size-4" />
        <span className="text-[12.5px] font-semibold">Solicitud nueva</span>
        <span className="ml-auto truncate text-[11.5px] text-canvas/60">{RAMOS[t].slice(RAMOS[t].indexOf(" ") + 1)}</span>
      </div>
    </div>
  );
}

function HandoffVisual() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const t = useTicker(2, 2200, inView);
  return (
    <div ref={ref} className="w-full rounded-2xl border border-fg/8 bg-canvas-3/60 p-3">
      <div className="flex items-center justify-between text-[12.5px]">
        <span className="text-fg/80">Atiende</span>
        <span className="relative flex h-8 w-[150px] items-center rounded-full bg-canvas-4 p-1 text-[11.5px] font-semibold">
          <span
            className={cn(
              "absolute top-1 h-6 w-[71px] rounded-full bg-brand transition-transform duration-700 ease-out-expo",
              t === 1 ? "translate-x-[71px]" : "translate-x-0",
            )}
          />
          <span className={cn("relative z-10 w-1/2 text-center transition-colors", t === 0 ? "text-canvas" : "text-mute")}>Bot</span>
          <span className={cn("relative z-10 w-1/2 text-center transition-colors", t === 1 ? "text-canvas" : "text-mute")}>Martina</span>
        </span>
      </div>
      <p className="mt-3 text-[12.5px] text-mute font-medium">
        {t === 1 ? "● Bot en pausa · conversación tomada" : "● Bot atendiendo"}
      </p>
    </div>
  );
}

function HoursVisual() {
  return (
    <div className="w-full space-y-2">
      <div className="max-w-[92%] rounded-2xl rounded-tl-md bg-canvas-4 px-3 py-2 text-[12.5px] leading-snug text-fg/85">
        Ahora estamos fuera de horario, pero dejanos tu mensaje igual y te respondemos al reabrir. 🙂
        <span className="ml-2 font-mono text-[9.5px] text-mute">23:12</span>
      </div>
      <div className="flex flex-wrap gap-1.5 font-mono text-[10.5px] text-mute">
        <span className="rounded-md border border-fg/8 px-2 py-1">Lun a Vie · 8 a 16 h</span>
        <span className="rounded-md border border-fg/8 px-2 py-1">25/12 · cerrado</span>
      </div>
    </div>
  );
}

function SosVisual() {
  return (
    <div className="flex w-full items-center gap-4">
      <span className="relative grid size-14 place-items-center rounded-full bg-coral text-canvas">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-coral" />
        <Lifebuoy className="relative size-6" />
      </span>
      <div className="text-[13px] leading-snug">
        <p className="font-semibold text-fg">🆘 Auxilio / Grúa</p>
        <p className="text-mute">El número de asistencia, en un toque. A las 4 AM también.</p>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section id="bot" className="relative py-20 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <Eyebrow>El bot</Eyebrow>
            <SplitReveal className="mt-5 font-display text-[clamp(2.4rem,5.6vw,5.2rem)] leading-[0.93] font-bold tracking-[-0.04em]">
              Todo lo que hoy te llega por WhatsApp,{" "}
              <span className="font-serif font-normal tracking-[-0.02em] text-brand italic">resuelto en el chat.</span>
            </SplitReveal>
          </div>
          <p data-reveal className="max-w-[520px] text-[17px] leading-relaxed text-fg/65 lg:justify-self-end">
            El asegurado escribe como siempre. Polisend lo reconoce, entiende qué necesita y lo resuelve con los datos
            reales de su póliza. Para los trámites usa botones y listas: rápido, claro y sin errores de tipeo.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card
            className="md:col-span-2"
            icon={ShieldWarning}
            kicker="Siniestros"
            title="La denuncia completa, con fotos, sin que levantes el teléfono."
            visual={<ClaimVisual />}
          >
            Póliza, fecha, relato, tarjeta verde, registro, datos del tercero y fotos del daño. Entra al panel y a tu
            mail con todo adjunto, y el cliente puede consultar en qué estado está.
          </Card>
          <Card icon={Receipt} kicker="Pagos y cobranzas" title="¿Cuánto debo? Al centavo." visual={<PaymentsVisual />}>
            Cuotas pendientes, vencidas y débitos rechazados, póliza por póliza.
          </Card>
          <Card icon={FilePdf} kicker="Documentación" title="La tarjeta del auto, en segundos." visual={<DocsVisual />}>
            Tarjeta de circulación, certificado de cobertura y cupón de pago, directo de la compañía.
          </Card>
          <Card
            className="md:col-span-2"
            icon={Lightning}
            kicker="Cotización al instante"
            title="Cotiza auto y moto con el precio real de la compañía."
            visual={<QuoteVisual />}
          >
            Marca, modelo, año y código postal. En la misma charla le muestra hasta 4 coberturas, de la más barata a la
            más completa. La IA no inventa precios: los consulta a la compañía en tiempo real.
          </Card>
          <Card icon={Lifebuoy} kicker="Auxilio" title="El número de grúa, siempre a mano." visual={<SosVisual />}>
            Quedarse en la ruta un domingo no debería depender de que alguien conteste.
          </Card>
          <Card icon={MoonStars} kicker="Fuera de horario" title="Atiende cuando vos no." visual={<HoursVisual />}>
            Tus horarios y feriados configurados. Fuera de hora resuelve igual y avisa cuándo responde una persona.
          </Card>
          <Card className="md:col-span-2" icon={UserPlus} kicker="Prospectos" title="¿No es cliente? Lo atiende igual." visual={<LeadsVisual />}>
            Cotiza 8 ramos y te deja la solicitud lista para cerrar, con los datos que hacen falta.
          </Card>
          <Card className="md:col-span-2" icon={Headset} kicker="Asesor humano" title="Y si pide una persona, la tiene." visual={<HandoffVisual />}>
            El bot se pausa y tu equipo sigue la charla desde el panel. Si no entiende dos veces, ofrece un asesor.
          </Card>
        </div>
      </div>
    </section>
  );
}
