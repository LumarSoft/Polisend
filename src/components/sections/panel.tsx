"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  BellRinging,
  CalendarDots,
  Files,
  GearSix,
  Receipt,
  ShieldWarning,
  SquaresFour,
  Tray as InboxIcon,
  User,
  UsersThree,
} from "@phosphor-icons/react";
import { LogoMark } from "@/components/brand/logo";
import { SplitReveal } from "@/components/ui/primitives";
import { useInView, useReducedMotion } from "@/lib/hooks";
import { IconBubble } from "@/components/brand/icon-bubble";
import { cn } from "@/lib/cn";

/* ─── tiny chart + number helpers ─────────────────────────── */

const ars = (n: number) => `$ ${n.toLocaleString("es-AR")}`;

function CountUp({ to, format = (n) => n.toLocaleString("es-AR"), ms = 1400 }: { to: number; format?: (n: number) => string; ms?: number }) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const reduce = useReducedMotion();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView || reduce) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(Math.round(to * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, to, ms]);
  return <span ref={ref} className="tabular-nums">{format(reduce ? to : v)}</span>;
}

function Widget({ title, sub, children, className }: { title: string; sub?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-fg/8 bg-white p-4", className)}>
      <p className="text-[13px] font-semibold tracking-tight text-fg">{title}</p>
      {sub && <p className="text-[11px] text-fg/45">{sub}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function HBars({ rows }: { rows: { k: string; v: number; c: string }[] }) {
  const max = Math.max(...rows.map((r) => r.v));
  return (
    <ul className="space-y-2.5">
      {rows.map((r, i) => (
        <li key={r.k} className="grid grid-cols-[84px_1fr_36px] items-center gap-2 text-[11.5px]">
          <span className="text-fg/60">{r.k}</span>
          <span className="h-2 overflow-hidden rounded-full bg-fg/6">
            <span
              className="block h-full origin-left animate-[growx_1.1s_var(--ease-out-expo)_both] rounded-full"
              style={{ width: `${(r.v / max) * 100}%`, background: r.c, animationDelay: `${i * 90}ms` }}
            />
          </span>
          <span className="text-right font-mono text-fg/80">{r.v}</span>
        </li>
      ))}
    </ul>
  );
}

/* ─── views ───────────────────────────────────────────────── */

const RENEWALS = [
  { m: "Nov", v: 64 },
  { m: "Dic", v: 81 },
  { m: "Ene", v: 58 },
  { m: "Feb", v: 47 },
  { m: "Mar", v: 72 },
  { m: "Abr", v: 55 },
];

function HomeView() {
  const max = Math.max(...RENEWALS.map((r) => r.v));
  const donut = [
    { k: "Vigentes", v: 1106, c: "#0b1526" },
    { k: "Por vencer (30d)", v: 64, c: "#f5a524" },
    { k: "Vencidas", v: 114, c: "#e5484d" },
  ];
  const total = donut.reduce((a, d) => a + d.v, 0);
  const R = 42;
  const C = 2 * Math.PI * R;
  const arcs = donut.map((d, i) => ({
    ...d,
    len: (d.v / total) * C,
    off: (donut.slice(0, i).reduce((a, x) => a + x.v, 0) / total) * C,
  }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { k: "Asegurados", v: <CountUp to={1284} />, i: UsersThree },
          { k: "Solicitudes nuevas", v: <CountUp to={37} />, i: Files },
          { k: "Deuda por cobrar", v: <CountUp to={4812300} format={ars} />, i: Receipt },
          { k: "Siniestros abiertos", v: <CountUp to={12} />, i: ShieldWarning },
        ].map(({ k, v, i: Icon }) => (
          <div key={k} className="rounded-2xl border border-fg/8 bg-white p-4">
            <div className="flex items-center justify-between text-[11.5px] text-fg/55">
              {k} <Icon className="size-4 text-fg/35" />
            </div>
            <p className="mt-2 font-display text-[clamp(1.2rem,2vw,1.7rem)] font-semibold tracking-tight text-fg">{v}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.6fr_1fr]">
        <Widget title="Próximas renovaciones" sub="Pólizas que vencen por mes · prima en riesgo: $ 38,4 M">
          <div className="flex h-[132px] items-end gap-3">
            {RENEWALS.map((r, i) => (
              <div key={r.m} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="font-mono text-[10.5px] text-fg/60">{r.v}</span>
                <span
                  className={cn("w-full origin-bottom animate-[growy_1.1s_var(--ease-out-expo)_both] rounded-t-lg", i === 1 ? "bg-brand-2" : "bg-fg/80")}
                  style={{ height: `${(r.v / max) * 92}px`, animationDelay: `${i * 80}ms` }}
                />
                <span className="text-[10.5px] text-fg/50">{r.m}</span>
              </div>
            ))}
          </div>
        </Widget>
        <Widget className="hidden sm:block" title="Cartera de clientes" sub="Estado de las pólizas">
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 100 100" className="size-[112px] shrink-0 -rotate-90">
              {arcs.map((d) => (
                <circle
                  key={d.k}
                  cx="50"
                  cy="50"
                  r={R}
                  fill="none"
                  stroke={d.c}
                  strokeWidth="14"
                  strokeDasharray={`${d.len} ${C}`}
                  strokeDashoffset={-d.off}
                />
              ))}
            </svg>
            <ul className="space-y-1.5 text-[11.5px]">
              {donut.map((d) => (
                <li key={d.k} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: d.c }} />
                  <span className="text-fg/60">{d.k}</span>
                  <span className="ml-auto pl-2 font-mono text-fg">{d.v.toLocaleString("es-AR")}</span>
                </li>
              ))}
            </ul>
          </div>
        </Widget>
      </div>
      <div className="hidden grid-cols-3 gap-3 md:grid">
        <Widget title="Seguimiento comercial" sub="Solicitudes por estado">
          <HBars rows={[{ k: "Nuevas", v: 37, c: "#1f4fe0" }, { k: "Contactadas", v: 52, c: "#7c5cfc" }, { k: "Cerradas", v: 118, c: "#0b1526" }]} />
        </Widget>
        <Widget title="Cobranzas" sub="Cuotas impagas por estado">
          <HBars rows={[{ k: "Pendientes", v: 142, c: "#f5a524" }, { k: "Vencidas", v: 38, c: "#e5484d" }, { k: "Rechazadas", v: 9, c: "#a8323a" }]} />
        </Widget>
        <Widget title="Siniestros" sub="Distribución por estado">
          <HBars rows={[{ k: "Pendiente", v: 5, c: "#f5a524" }, { k: "En proceso", v: 7, c: "#7c5cfc" }, { k: "Resuelto", v: 86, c: "#12b76a" }]} />
        </Widget>
      </div>
    </div>
  );
}

function InboxView() {
  const convs = [
    { n: "Jorge P.", m: "Quiero hablar con alguien", s: "Pendiente", tone: "bg-coral/15 text-coral" },
    { n: "Lucía G.", m: "listo", s: "Bot", tone: "bg-brand/20 text-[#1840b8]" },
    { n: "Ana M.", m: "Gracias Martina!!", s: "Tomada", tone: "bg-violet/20 text-[#5b3fd6]" },
    { n: "Carlos B.", m: "AB987CD", s: "Bot", tone: "bg-brand/20 text-[#1840b8]" },
    { n: "Rocío T.", m: "¿Cuánto sale asegurar mi casa?", s: "Bot", tone: "bg-brand/20 text-[#1840b8]" },
  ];
  return (
    <div className="grid grid-cols-1 h-full gap-3 md:grid-cols-[230px_1fr]">
      <ul className="hidden overflow-hidden rounded-2xl border border-fg/8 bg-white md:block">
        {convs.map((c, i) => (
          <li key={c.n} className={cn("animate-pop border-b border-fg/6 px-3.5 py-3", i === 0 && "bg-fg/[0.04]")} style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-fg">{c.n}</span>
              <span className={cn("rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold", c.tone)}>{c.s}</span>
            </div>
            <p className="truncate text-[11.5px] text-fg/50">{c.m}</p>
          </li>
        ))}
      </ul>
      <div className="flex min-h-[320px] flex-col overflow-hidden rounded-2xl border border-fg/8 bg-white">
        <div className="flex items-center gap-2 border-b border-fg/8 px-4 py-2.5">
          <span className="grid size-7 place-items-center rounded-full bg-fg text-[11px] font-bold text-canvas">J</span>
          <div className="leading-tight">
            <p className="text-[12.5px] font-semibold text-fg">Jorge P.</p>
            <p className="text-[10.5px] text-fg/45">Cliente · 2 pólizas</p>
          </div>
          <span className="ml-auto rounded-full bg-brand px-3 py-1.5 text-[11px] font-semibold text-on-brand">Tomar conversación</span>
        </div>
        <div className="flex flex-1 flex-col justify-end gap-1.5 bg-[#eef2f7] p-3 text-[12px]">
          <p className="max-w-[75%] self-start rounded-xl rounded-tl-sm bg-white px-2.5 py-1.5 text-fg">Hola, ¿mi póliza cubre granizo?</p>
          <p className="max-w-[75%] self-end rounded-xl rounded-tr-sm bg-[#dbe5ff] px-2.5 py-1.5 text-fg">
            Depende de la cobertura que tengas. Te paso con alguien del equipo que lo revisa con tu póliza. <span className="text-[9px] text-fg/40">· bot</span>
          </p>
          <p className="max-w-[75%] self-start rounded-xl rounded-tl-sm bg-white px-2.5 py-1.5 text-fg">Quiero hablar con alguien</p>
          <p className="mx-auto my-1 rounded-full bg-coral/12 px-2.5 py-0.5 text-[11.5px] text-coral font-medium">Pidió un asesor · esperando</p>
        </div>
      </div>
    </div>
  );
}

function NewsView() {
  const items = [
    { i: ShieldWarning, t: "Nuevo siniestro · Lucía G.", d: "Peugeot 208 · choque trasero · 4 adjuntos", w: "hace 2 min", unread: true, c: "text-coral bg-coral/12" },
    { i: User, t: "Pidió hablar con un asesor · Jorge P.", d: "“Quiero hablar con alguien”", w: "hace 9 min", unread: true, c: "text-[#5b3fd6] bg-violet/20" },
    { i: ShieldWarning, t: "Nuevo siniestro · Diego F.", d: "Robo · bicicleta eléctrica · 3 adjuntos", w: "hace 1 h", c: "text-coral bg-coral/12" },
    { i: User, t: "Pidió hablar con un asesor · Ana M.", d: "Cambio de cobertura", w: "ayer", c: "text-[#5b3fd6] bg-violet/20" },
    { i: ShieldWarning, t: "Nuevo siniestro · Carla V.", d: "Granizo · Fiat Cronos · 4 adjuntos", w: "ayer", c: "text-coral bg-coral/12" },
  ];
  return (
    <div className="rounded-2xl border border-fg/8 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-fg/8 px-4 py-3 text-[11px]">
        {["Todas", "Siniestros", "Asesor"].map((f, i) => (
          <span key={f} className={cn("rounded-full px-2.5 py-1 font-semibold", i === 0 ? "bg-fg text-canvas" : "text-fg/50")}>{f}</span>
        ))}
        <span className="ml-auto text-fg/45">Marcar todas como leídas</span>
      </div>
      <ul>
        {items.map(({ i: Icon, t, d, w, unread, c }, idx) => (
          <li key={t + w} className="flex animate-pop items-center gap-3 border-b border-fg/6 px-4 py-3 last:border-0" style={{ animationDelay: `${idx * 70}ms` }}>
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", c)}>
              <Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-semibold text-fg">{t}</p>
              <p className="truncate text-[11.5px] text-fg/50">{d}</p>
            </div>
            <span className="ml-auto shrink-0 text-[10.5px] text-fg/40">{w}</span>
            {unread && <span className="size-2 shrink-0 rounded-full bg-coral" />}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LeadsView() {
  const rows = [
    { n: "Rocío T.", p: "Hogar · Plan Plus", o: "WhatsApp", s: "Nueva", c: "bg-brand/25 text-[#1840b8]" },
    { n: "Pablo K.", p: "Auto · Todo Riesgo", o: "Web", s: "Nueva", c: "bg-brand/25 text-[#1840b8]" },
    { n: "Sofía M.", p: "Moto · Terceros Completo", o: "WhatsApp", s: "Contactada", c: "bg-violet/20 text-[#5b3fd6]" },
    { n: "Comercio La Esquina", p: "Comercio", o: "WhatsApp", s: "Contactada", c: "bg-violet/20 text-[#5b3fd6]" },
    { n: "Dra. Julia R.", p: "Praxis profesional", o: "WhatsApp", s: "Cerrada", c: "bg-fg/8 text-fg/60" },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-fg/8 bg-white">
      <div className="grid grid-cols-[1.2fr_1.3fr_0.8fr_0.8fr] gap-2 border-b border-fg/8 px-4 py-2.5 text-[10.5px] font-semibold tracking-wide text-fg/45 uppercase">
        <span>Contacto</span>
        <span>Producto</span>
        <span>Origen</span>
        <span>Estado</span>
      </div>
      {rows.map((r, i) => (
        <div key={r.n} className="grid animate-pop grid-cols-[1.2fr_1.3fr_0.8fr_0.8fr] items-center gap-2 border-b border-fg/6 px-4 py-3 text-[12px] last:border-0" style={{ animationDelay: `${i * 70}ms` }}>
          <span className="truncate font-semibold text-fg">{r.n}</span>
          <span className="truncate text-fg/65">{r.p}</span>
          <span className="text-fg/55">{r.o}</span>
          <span className={cn("w-fit rounded-full px-2 py-0.5 text-[10.5px] font-semibold", r.c)}>{r.s}</span>
        </div>
      ))}
    </div>
  );
}

function DebtView() {
  const rows = [
    { n: "Martín R.", p: "0032 · Toyota Etios", q: "07/12", v: "28/10", s: "Vencida", c: "bg-coral/12 text-coral", a: 51200 },
    { n: "Jorge L.", p: "0118 · VW Gol Trend", q: "04/06", v: "01/11", s: "Débito rechazado", c: "bg-coral/12 text-coral", a: 39800 },
    { n: "Lucía G.", p: "0041 · Peugeot 208", q: "10/12", v: "05/11", s: "Pendiente", c: "bg-amber/20 text-[#8a5a00]", a: 48300 },
    { n: "Hernán B.", p: "0207 · Hogar", q: "02/12", v: "10/11", s: "Pendiente", c: "bg-amber/20 text-[#8a5a00]", a: 18900 },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { k: "Deuda total", v: <CountUp to={4812300} format={ars} /> },
          { k: "Clientes con deuda", v: <CountUp to={61} /> },
          { k: "Cuotas vencidas", v: <CountUp to={38} /> },
          { k: "Cuotas rechazadas", v: <CountUp to={9} /> },
        ].map((s) => (
          <div key={s.k} className="rounded-2xl border border-fg/8 bg-white p-4">
            <p className="text-[11.5px] text-fg/55">{s.k}</p>
            <p className="mt-1.5 font-display text-[clamp(1.1rem,1.8vw,1.5rem)] font-semibold tracking-tight text-fg">{s.v}</p>
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-fg/8 bg-white">
        {rows.map((r, i) => (
          <div key={r.n} className="grid animate-pop grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 border-b border-fg/6 px-4 py-3 text-[12px] last:border-0 sm:grid-cols-[1fr_1.4fr_0.5fr_0.5fr_1fr_0.8fr]" style={{ animationDelay: `${i * 70}ms` }}>
            <span className="font-semibold text-fg">{r.n}</span>
            <span className="hidden truncate text-fg/60 sm:block">{r.p}</span>
            <span className="hidden font-mono text-fg/60 sm:block">{r.q}</span>
            <span className="hidden font-mono text-fg/60 sm:block">{r.v}</span>
            <span className={cn("w-fit rounded-full px-2 py-0.5 text-[10.5px] font-semibold", r.c)}>{r.s}</span>
            <span className="text-right font-mono font-semibold text-fg">{ars(r.a)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const TABS = [
  { id: "inicio", label: "Inicio", icon: SquaresFour, view: HomeView },
  { id: "inbox", label: "Inbox", icon: InboxIcon, view: InboxView },
  { id: "novedades", label: "Novedades", icon: BellRinging, view: NewsView },
  { id: "solicitudes", label: "Solicitudes", icon: Files, view: LeadsView },
  { id: "cobranzas", label: "Cobranzas", icon: Receipt, view: DebtView },
];

const SIDEBAR = [
  { k: "Inicio", i: SquaresFour, tab: "inicio" },
  { k: "Inbox", i: InboxIcon, tab: "inbox", badge: "1" },
  { k: "Novedades", i: BellRinging, tab: "novedades", badge: "2" },
  { k: "Siniestros", i: ShieldWarning },
  { k: "Solicitudes", i: Files, tab: "solicitudes" },
  { k: "Asegurados", i: UsersThree },
  { k: "Cobranzas", i: Receipt, tab: "cobranzas" },
  { k: "Configuración", i: GearSix },
];

const POINTS = [
  { icon: CalendarDots, t: "Renovaciones a 6 meses", d: "Quién vence cada mes y cuánta prima está en juego. Tu lista de llamados, ordenada." },
  { icon: Receipt, t: "Cobranzas al día", d: "Deuda por cobrar, cuotas vencidas y débitos rechazados, cliente por cliente." },
  { icon: ShieldWarning, t: "Siniestros con estado", d: "Pendiente, en proceso, resuelto. Y el asegurado lo consulta solo por WhatsApp." },
  { icon: Files, t: "Solicitudes que no se pierden", d: "Cada prospecto del bot o de la web entra como solicitud: nueva, contactada, cerrada." },
];

export function Panel() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const [ref, inView] = useInView<HTMLDivElement>("-20% 0px");
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!auto || !inView || reduce) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % TABS.length), 6500);
    return () => window.clearTimeout(id);
  }, [active, auto, inView, reduce]);

  const select = (i: number) => {
    setAuto(false);
    setActive(i);
  };
  const View = TABS[active].view;

  return (
    <section id="panel" className="relative z-10 -mt-10 rounded-[44px] bg-canvas py-24 text-fg sm:rounded-[64px] sm:py-32">
      <div className="grid-lines pointer-events-none absolute inset-0 rounded-t-[inherit] [mask-image:linear-gradient(to_bottom,#000,transparent_40%)]" />
      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 text-[13px] font-medium text-fg/50">
              El panel
            </span>
            <SplitReveal className="mt-5 font-display text-[clamp(2.5rem,6vw,5.6rem)] leading-[0.92] font-bold tracking-[-0.04em]">
              Y vos, lo ves todo{" "}
              <span className="font-serif font-normal tracking-[-0.02em] text-fg/60 italic">desde un solo lugar.</span>
            </SplitReveal>
          </div>
          <p data-reveal className="max-w-[520px] text-[17px] leading-relaxed text-fg/65 lg:justify-self-end">
            Cada conversación, siniestro, solicitud y cuota en un panel pensado para una productora. Sin planillas,
            sin buscar en el chat, sin preguntar “¿quién atendió a este cliente?”.
          </p>
        </div>

        <div ref={ref} data-reveal className="mt-12">
          <div role="tablist" aria-label="Vistas del panel" className="mb-4 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            {TABS.map((t, i) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={active === i}
                onClick={() => select(i)}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 overflow-hidden rounded-full border px-4 py-2 text-[13.5px] font-semibold transition-colors duration-300",
                  active === i ? "border-fg bg-fg text-canvas" : "border-fg/12 text-fg/60 hover:border-fg/30 hover:text-fg",
                )}
              >
                <t.icon className="size-4" />
                {t.label}
                {active === i && auto && !reduce && (
                  <span key={`${active}-bar`} className="absolute bottom-0 left-0 h-0.5 w-full origin-left animate-[growx_6.5s_linear_both] bg-brand" />
                )}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-[26px] border border-fg/10 bg-[#f3f5f9] shadow-[0_40px_120px_-40px_rgb(11_21_38/0.25)]">
            <div className="flex items-center gap-2 border-b border-fg/8 bg-white px-4 py-3">
              <span className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                <span className="size-2.5 rounded-full bg-[#febc2e]" />
                <span className="size-2.5 rounded-full bg-[#28c840]" />
              </span>
              <span className="mx-auto rounded-full bg-fg/5 px-4 py-1 font-mono text-[11px] text-fg/50">
                app.polisend.com/panel/{TABS[active].id}
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[210px_1fr]">
              <aside className="hidden flex-col bg-fg p-3 text-canvas lg:flex">
                <div className="mb-4 flex items-center gap-2 px-2 pt-1">
                  <LogoMark className="h-5 w-auto text-brand" />
                  <span className="font-display text-[15px] font-bold tracking-tight">Tu Productora</span>
                </div>
                {SIDEBAR.map((s) => {
                  const idx = TABS.findIndex((t) => t.id === s.tab);
                  const on = idx === active;
                  return (
                    <button
                      key={s.k}
                      type="button"
                      tabIndex={-1}
                      onClick={() => idx >= 0 && select(idx)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] transition-colors",
                        on ? "bg-brand font-semibold text-on-brand" : "text-canvas/60 hover:text-canvas",
                        idx < 0 && "cursor-default",
                      )}
                    >
                      <s.i className="size-4" />
                      {s.k}
                      {s.badge && (
                        <span className={cn("ml-auto rounded-full px-1.5 text-[10px] font-bold", on ? "bg-fg text-brand" : "bg-coral text-fg")}>{s.badge}</span>
                      )}
                    </button>
                  );
                })}
              </aside>
              <div key={active} className="h-[480px] animate-[pop_0.6s_var(--ease-out-expo)_both] overflow-hidden p-3 sm:h-[620px] sm:p-5">
                <View />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map(({ icon: Icon, t, d }) => (
            <div key={t} data-reveal>
              <IconBubble icon={Icon} tone="dark" size={42} />
              <h3 className="mt-4 font-display text-[19px] font-semibold tracking-tight">{t}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-fg/60">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
