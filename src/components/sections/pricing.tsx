import { Check } from "@phosphor-icons/react/ssr";
import { LogoMark } from "@/components/brand/logo";
import { CtaButton, Eyebrow, SplitReveal } from "@/components/ui/primitives";
import { SITE } from "@/lib/site";

const INCLUDED = [
  "Bot de WhatsApp con IA, 24 h, 7 días",
  "Siniestros con fotos, pagos, documentos y cotizador",
  "Panel: inbox, novedades, cobranzas, renovaciones y solicitudes",
  "Integración con Triunfo y Sancor, cartera sincronizada",
  "Nombre, tono, horarios, planes y coberturas a tu medida",
  "Alta y puesta en marcha a cargo nuestro",
];

export function Pricing() {
  const messages = SITE.messagesPerPlan.toLocaleString("es-AR");
  const perMessage = (SITE.priceUsd / SITE.messagesPerPlan).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
  });
  return (
    <section id="precio" className="relative overflow-hidden py-20 sm:py-32">
      <div className="absolute inset-x-0 top-1/3 -z-10 mx-auto h-[520px] max-w-[1100px] rounded-full bg-[radial-gradient(ellipse,rgb(31_79_224/0.12),transparent_65%)] blur-2xl" />
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[860px] text-center">
          <Eyebrow>Precio de Polisend</Eyebrow>
          <SplitReveal className="mt-5 font-display text-[clamp(2.4rem,5.6vw,5.2rem)] leading-[0.93] font-bold tracking-[-0.04em]">
            Menos de lo que cuesta{" "}
            <span className="font-serif font-normal tracking-[-0.02em] text-brand italic">no contestar.</span>
          </SplitReveal>
        </div>

        <div data-reveal className="relative mx-auto mt-14 grid max-w-[1120px] grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[36px] border border-fg/10 bg-canvas-2 lg:grid-cols-[1fr_1.05fr]">
          <div className="relative overflow-hidden bg-brand p-8 text-on-brand sm:p-12">
            <LogoMark className="absolute -right-10 -bottom-14 h-[300px] w-auto text-canvas/[0.07]" />
            <p className="flex items-start font-display leading-[0.8] font-bold tracking-[-0.05em]">
              <span className="mt-3 mr-1 text-[clamp(1.6rem,3vw,2.4rem)] tracking-tight">USD</span>
              <span className="text-[clamp(6rem,15vw,11rem)]">{SITE.priceUsd}</span>
              <span className="mt-auto mb-2 ml-1 text-[clamp(1.2rem,2.2vw,1.8rem)] tracking-tight">/mes</span>
            </p>
            <p className="mt-4 text-[20px] font-semibold tracking-tight">por cada {messages} mensajes</p>
            <p className="mt-8 max-w-[360px] font-serif text-[30px] leading-[1.05] italic">
              USD {perMessage} por mensaje. Atendiendo las 24 horas.
            </p>
          </div>
          <div className="flex flex-col p-8 sm:p-12">
            <p className="font-display text-[22px] font-semibold tracking-tight">Todo incluido</p>
            <ul className="mt-6 space-y-3.5">
              {INCLUDED.map((item) => (
                <li key={item} className="flex gap-3 text-[15.5px] leading-snug text-fg/80">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand text-on-brand">
                    <Check weight="bold" className="size-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-10">
              <CtaButton size="lg" className="w-full justify-between sm:w-auto">
                Quiero Polisend<span className="hidden sm:inline"> en mi productora</span>
              </CtaButton>
              <p className="mt-4 text-[13px] text-mute">
                No toma vacaciones. No pide licencia. No deja mensajes en visto.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
