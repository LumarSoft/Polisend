import { cacheLife } from "next/cache";
import type { Plan, PlanCatalog } from "./plan-format";

/**
 * The catalog the platform starts with (api_john, migration
 * 20261030120000_global_message_plans), in tokens and without prices. Shown
 * while NEXT_PUBLIC_API_URL is not set or the API does not answer.
 */
export const DEFAULT_CATALOG: PlanCatalog = {
  plans: [
    { name: "Prueba", tokens: 100, isTrial: true },
    { name: "Inicial", tokens: 500, isTrial: false },
    { name: "Profesional", tokens: 1000, isTrial: false },
  ],
  blockTokens: 1000,
};

const DEFAULT_BLOCK_TOKENS = 1000;

/** A finite number, or undefined. */
const numberOr = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

/**
 * One plan of GET /public/plans: `{ id?, name, tokens, isTrial? }` (an API older than 2026-11-17 sends `messages`
 * and a price instead; the price is never read). These field names are the one place to change if the API's differ.
 */
function planOf(value: unknown): Plan | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const tokens = numberOr(raw.tokens) ?? numberOr(raw.messages);
  if (typeof raw.name !== "string" || tokens === undefined) return null;
  return { name: raw.name, tokens, isTrial: raw.isTrial === true };
}

/** The API's answer as the page's catalog, or null when it is not one (the page then shows the default). */
function catalogOf(value: unknown): PlanCatalog | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.plans)) return null;
  const plans = raw.plans.map(planOf);
  if (plans.some((p) => p === null)) return null;
  const valid = plans as Plan[];
  if (!valid.some((p) => !p.isTrial)) return null;
  const blockTokens = numberOr(raw.blockTokens) ?? numberOr(raw.blockMessages) ?? DEFAULT_BLOCK_TOKENS;
  return { plans: valid, blockTokens };
}

/**
 * The plans the Developer set in the panel (GET /public/plans of the API),
 * cached for an hour. Without NEXT_PUBLIC_API_URL, or when the API fails, the
 * default catalog.
 */
export async function getPlans(): Promise<PlanCatalog> {
  "use cache";
  cacheLife("hours");
  const api = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!api) return DEFAULT_CATALOG;
  try {
    const res = await fetch(`${api}/public/plans`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return DEFAULT_CATALOG;
    return catalogOf(await res.json()) ?? DEFAULT_CATALOG;
  } catch {
    return DEFAULT_CATALOG;
  }
}
