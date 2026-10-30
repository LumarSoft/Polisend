import { cacheLife } from "next/cache";
import type { PlanCatalog } from "./plan-format";

/**
 * The catalog the platform starts with (api_john, migration
 * 20261030120000_global_message_plans). Shown while NEXT_PUBLIC_API_URL is not set
 * or the API does not answer, so the page always has prices.
 */
export const DEFAULT_CATALOG: PlanCatalog = {
  plans: [
    { name: "Prueba", messages: 100, priceUsd: 0, isTrial: true },
    { name: "Inicial", messages: 500, priceUsd: 25, isTrial: false },
    { name: "Profesional", messages: 1000, priceUsd: 50, isTrial: false },
  ],
  blockMessages: 1000,
  blockPriceUsd: 50,
};

function isCatalog(value: unknown): value is PlanCatalog {
  const data = value as PlanCatalog | null;
  return (
    !!data &&
    Array.isArray(data.plans) &&
    data.plans.some((p) => !p.isTrial) &&
    data.plans.every((p) => typeof p.name === "string" && Number.isFinite(p.messages) && Number.isFinite(p.priceUsd)) &&
    Number.isFinite(data.blockMessages)
  );
}

/**
 * The plans the owner set in the panel (GET /public/plans of the API), cached
 * for an hour. Without NEXT_PUBLIC_API_URL, or when the API fails, the default
 * catalog.
 */
export async function getPlans(): Promise<PlanCatalog> {
  "use cache";
  cacheLife("hours");
  const api = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!api) return DEFAULT_CATALOG;
  try {
    const res = await fetch(`${api}/public/plans`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return DEFAULT_CATALOG;
    const data: unknown = await res.json();
    return isCatalog(data) ? data : DEFAULT_CATALOG;
  } catch {
    return DEFAULT_CATALOG;
  }
}
