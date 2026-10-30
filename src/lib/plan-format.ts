/** Polisend's plans as the page shows them: types and wording, safe on the client. */

/** A plan of Polisend's catalog: messages a month for a price. The owner edits it in the panel. */
export interface Plan {
  name: string;
  messages: number;
  priceUsd: number;
  /** The free plan of a new account's number in its first month. */
  isTrial: boolean;
}

export interface PlanCatalog {
  plans: Plan[];
  /** Messages per block past the largest plan, and what each block costs. */
  blockMessages: number;
  blockPriceUsd: number | null;
}

export const paidPlans = (catalog: PlanCatalog) =>
  catalog.plans.filter((p) => !p.isTrial).sort((a, b) => a.messages - b.messages);

export const trialPlan = (catalog: PlanCatalog) => catalog.plans.find((p) => p.isTrial) ?? null;

export const int = (n: number) => n.toLocaleString("es-AR");
export const usd = (n: number) => `USD ${n.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`;

/** One sentence with every plan, for the FAQ, the structured data and /llms.txt. */
export function pricingSentence(catalog: PlanCatalog): string {
  const paid = paidPlans(catalog)
    .map((p) => `${p.name}, ${int(p.messages)} mensajes por ${usd(p.priceUsd)} al mes`)
    .join("; ");
  const trial = trialPlan(catalog);
  const largest = paidPlans(catalog).at(-1);
  return [
    `Planes por número de WhatsApp, según los mensajes que envía por mes: ${paid}.`,
    trial ? `El primer mes de una cuenta nueva, ${int(trial.messages)} mensajes gratis.` : "",
    "Si un número supera su plan, pasa al siguiente.",
    largest && catalog.blockPriceUsd
      ? `Pasado el plan ${largest.name}, cada ${int(catalog.blockMessages)} mensajes suman ${usd(catalog.blockPriceUsd)}.`
      : "",
    "Incluye el bot, el panel, la integración con la compañía, los mensajes de WhatsApp y la puesta en marcha.",
  ]
    .filter(Boolean)
    .join(" ");
}
