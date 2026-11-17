import { Check } from "@phosphor-icons/react/ssr";
import { LogoMark } from "@/components/brand/logo";
import { CtaButton, Eyebrow, SplitReveal } from "@/components/ui/primitives";
import { int, paidPlans, PLANS_INQUIRY, TOKENS_RULE, trialPlan, type PlanCatalog } from "@/lib/plan-format";

const INCLUDED = [
  "Bot de WhatsApp con IA, 24 h, 7 días",
  "Siniestros con fotos, pagos, documentos y cotizador",
  "Panel: inbox, novedades, cobranzas, renovaciones y solicitudes",
  "Integración con Triunfo y Sancor, cartera sincronizada",
  "Los mensajes de WhatsApp, incluidos en el plan",
  "Nombre, tono, horarios y coberturas a tu medida",
  "Alta y puesta en marcha a cargo nuestro",
];

export function Pricing({ catalog }: { catalog: PlanCatalog }) {
  const paid = paidPlans(catalog);
  const trial = trialPlan(catalog);
  const from = paid[0];
  const largest = paid.at(-1);
  const rows = trial ? [trial, ...paid] : paid;
  return (
    <section id="precio" className="relative overflow-hidden py-20 sm:py-32">
      <div className="absolute inset-x-0 top-1/3 -z-10 mx-auto h-[520px] max-w-[1100px] rounded-full bg-[radial-gradient(ellipse,rgb(31_79_224/0.12),transparent_65%)] blur-2xl" />
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[860px] text-center">
          <Eyebrow>Planes de Polisend</Eyebrow>
          <SplitReveal className="mt-5 font-display text-[clamp(2.4rem,5.6vw,5.2rem)] leading-[0.93] font-bold tracking-[-0.04em]">
            Menos de lo que cuesta{" "}
            <span className="font-serif font-normal tracking-[-0.02em] text-brand italic">no contestar.</span>
          </SplitReveal>
        </div>

        <div data-reveal className="relative mx-auto mt-14 grid max-w-[1120px] grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[36px] border border-fg/10 bg-canvas-2 lg:grid-cols-[1fr_1.05fr]">
          <div className="relative overflow-hidden bg-brand p-8 text-on-brand sm:p-12">
            <LogoMark className="absolute -right-10 -bottom-14 h-[300px] w-auto text-canvas/[0.07]" />
            {from && (
              <>
                <p className="text-[14px] font-semibold tracking-[0.18em] text-on-brand/70 uppercase">Desde</p>
                <p className="mt-2 font-display text-[clamp(4.5rem,10vw,8rem)] leading-[0.8] font-bold tracking-[-0.05em]">
                  {int(from.tokens)}
                </p>
                <p className="mt-4 text-[20px] font-semibold tracking-tight">tokens por mes, por número de WhatsApp</p>
              </>
            )}
            <ul className="relative mt-8 divide-y divide-on-brand/15 border-y border-on-brand/15">
              {rows.map((plan) => (
                <li key={plan.name} className="flex items-baseline justify-between gap-4 py-3.5">
                  <span className="text-[16px] font-semibold">
                    {plan.name}
                    <span className="ml-2 text-[14px] font-normal text-on-brand/70">
                      {plan.isTrial ? "gratis el primer mes" : "por mes"}
                    </span>
                  </span>
                  <span className="shrink-0 font-display text-[22px] font-bold tracking-tight whitespace-nowrap">
                    {int(plan.tokens)} tokens
                  </span>
                </li>
              ))}
            </ul>
            <p className="relative mt-4 text-[14px] text-on-brand/75">{TOKENS_RULE}.</p>
            <p className="relative mt-6 max-w-[380px] font-serif text-[24px] leading-[1.1] italic">
              Nunca te subimos de plan sin preguntarte.
            </p>
            {largest && (
              <p className="relative mt-3 text-[14px] text-on-brand/75">
                Pasado el plan {largest.name}, se suman bloques de {int(catalog.blockTokens)} tokens.
              </p>
            )}
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
              <CtaButton size="lg" message={PLANS_INQUIRY} className="w-full justify-between sm:w-auto">
                Consultanos<span className="hidden sm:inline"> el plan para tu productora</span>
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
