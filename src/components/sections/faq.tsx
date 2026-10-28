import { Plus } from "@phosphor-icons/react/ssr";
import { Eyebrow, SplitReveal } from "@/components/ui/primitives";

const FAQ = [
  {
    q: "¿Tengo que cambiar mi forma de trabajar?",
    a: "No. Tus asegurados siguen escribiendo al WhatsApp de siempre. Polisend resuelve lo repetitivo y te deja en el panel, ordenado, lo que necesita una persona.",
  },
  {
    q: "¿Con qué compañías funciona?",
    a: "Polisend está integrado con Triunfo Seguros y Sancor Seguros: cartera, cuotas, documentación y cotizador. Si trabajás con otra compañía, escribinos y lo vemos.",
  },
  {
    q: "¿La IA puede inventar precios o coberturas?",
    a: "No. Siniestros, pagos y documentos corren por flujos guiados, sin IA. Las cotizaciones salen de la compañía en tiempo real y las coberturas se describen con tus propios textos. Si el bot no sabe algo, lo dice y deriva a un asesor.",
  },
  {
    q: "¿Cómo sabe quién es cada asegurado?",
    a: "Se identifica con su DNI o la patente del vehículo. A partir de ahí el bot ve sus pólizas, vehículos y estado de cuenta, y le muestra solo lo suyo.",
  },
  {
    q: "¿Qué pasa si el cliente quiere hablar con una persona?",
    a: "Lo pide en el chat o lo elige del menú. El bot se pausa, te llega una novedad y tu equipo sigue la conversación desde el inbox del panel. Cuando la liberás, el bot vuelve a atender.",
  },
  {
    q: "¿Y fuera de horario?",
    a: "Atiende igual, las 24 horas, fines de semana y feriados. Vos configurás tus horarios y cierres; cuando la oficina está cerrada, el bot avisa cuándo va a responder una persona.",
  },
  {
    q: "¿Cuánto cuesta?",
    a: "USD 60 por mes por cada 1.000 mensajes. Incluye el bot, el panel, la integración con la compañía y la puesta en marcha. Además, cada número tiene un tope de gasto: si se alcanza, el bot sigue atendiendo con los flujos guiados.",
  },
  {
    q: "¿Puedo tener varios números, códigos de productor o usuarios?",
    a: "Sí. Tu productora puede tener varios números de WhatsApp, varios códigos de productor y un usuario para cada persona del equipo.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="relative border-t border-fg/6 py-20 sm:py-32">
      <div className="mx-auto grid grid-cols-1 max-w-[1400px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Eyebrow>Preguntas</Eyebrow>
          <SplitReveal className="mt-5 font-display text-[clamp(2.4rem,4.6vw,4.4rem)] leading-[0.95] font-bold tracking-[-0.04em]">
            Lo que te estás <span className="font-serif font-normal tracking-[-0.02em] text-fg/70 italic">preguntando.</span>
          </SplitReveal>
        </div>
        <div className="divide-y divide-fg/8 border-y border-fg/8">
          {FAQ.map((f) => (
            <details key={f.q} data-reveal className="group py-1 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left font-display text-[clamp(1.1rem,1.6vw,1.4rem)] font-semibold tracking-[-0.02em] text-fg transition-colors hover:text-brand">
                {f.q}
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-fg/12 transition-all duration-500 group-open:rotate-45 group-open:border-brand group-open:bg-brand group-open:text-on-brand">
                  <Plus className="size-4" />
                </span>
              </summary>
              <p className="max-w-[640px] pb-6 text-[16px] leading-relaxed text-fg/65">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
