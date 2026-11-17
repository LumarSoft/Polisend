/** Polisend's plans as the page shows them: types and wording, safe on the client. */

/**
 * A plan of Polisend's catalog: tokens a month (1 message = 1 token, a campaign message = 2). The page never shows a
 * price (decision of 17/11): whoever wants one asks.
 */
export interface Plan {
  name: string;
  tokens: number;
  /** The free plan of a new account's number in its first month. */
  isTrial: boolean;
}

export interface PlanCatalog {
  plans: Plan[];
  /** Tokens per block past the largest plan. */
  blockTokens: number;
}

export const paidPlans = (catalog: PlanCatalog) =>
  catalog.plans.filter((p) => !p.isTrial).sort((a, b) => a.tokens - b.tokens);

export const trialPlan = (catalog: PlanCatalog) => catalog.plans.find((p) => p.isTrial) ?? null;

export const int = (n: number) => n.toLocaleString("es-AR");

/** The rule of the unit, said the same way everywhere. */
export const TOKENS_RULE = "1 mensaje = 1 token · un mensaje de campaña = 2 tokens";

/** The WhatsApp message the "consultanos" buttons start with. */
export const PLANS_INQUIRY = "Hola, quiero consultar los planes de Polisend para mi productora.";

/** One sentence with every plan, for the FAQ, the structured data and /llms.txt. Never a price. */
export function pricingSentence(catalog: PlanCatalog): string {
  const paid = paidPlans(catalog)
    .map((p) => `${p.name}, ${int(p.tokens)} tokens por mes`)
    .join("; ");
  const trial = trialPlan(catalog);
  const largest = paidPlans(catalog).at(-1);
  return [
    `Planes por número de WhatsApp, según los tokens que usa por mes: ${paid}.`,
    "Cada mensaje que envía el asistente, el equipo desde el panel o un aviso cuenta 1 token; cada mensaje de campaña, 2.",
    trial ? `El primer mes de una cuenta nueva, ${int(trial.tokens)} tokens gratis.` : "",
    "Nunca se pasa a un plan más grande sin preguntar: al llegar al límite, el asistente se pausa hasta que la productora elija.",
    largest ? `Pasado el plan ${largest.name}, se suman bloques de ${int(catalog.blockTokens)} tokens.` : "",
    "Incluye el bot, el panel, la integración con la compañía, los mensajes de WhatsApp y la puesta en marcha. Consultanos y te armamos la propuesta para tu productora.",
  ]
    .filter(Boolean)
    .join(" ");
}
