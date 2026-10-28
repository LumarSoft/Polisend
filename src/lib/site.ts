/**
 * Commercial constants for the landing. The sales WhatsApp number comes from
 * NEXT_PUBLIC_WHATSAPP_NUMBER (international format, digits only, e.g.
 * 5493412776893); defaults to the Polisend sales line.
 */
/**
 * Public origin, no trailing slash. Canonical, sitemap, OG and JSON-LD URLs use
 * it, so it must be a domain that actually serves the site (link previews fetch
 * the og:image from here). Order: explicit NEXT_PUBLIC_SITE_URL, then Vercel's
 * production domain (it switches to the custom domain once one is added), then
 * the current production deployment.
 */
function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url = explicit || (vercel ? `https://${vercel}` : "https://polisend.vercel.app");
  return url.replace(/\/$/, "");
}

export const SITE = {
  name: "Polisend",
  url: siteUrl(),
  title: "Bot de WhatsApp para productores de seguros | Polisend",
  description:
    "Bot de WhatsApp con IA para productores de seguros: atiende 24/7 denuncias de siniestro con fotos, cuotas, pólizas y cotizaciones, con un panel para tu equipo.",
  company: "Lumarsoft",
  city: "Rosario",
  region: "Santa Fe",
  country: "AR",
  /** Bump when the page content changes meaningfully (sitemap lastModified). */
  lastUpdated: "2026-10-27",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5493412776893",
  phoneDisplay: "+54 9 341 277-6893",
  whatsappMessage:
    "¡Hola! Quiero Polisend para mi productora de seguros. ¿Me cuentan cómo arrancamos?",
  priceUsd: 60,
  messagesPerPlan: 1000,
  insurers: ["Triunfo Seguros", "Sancor Seguros"],
} as const;

export function whatsappUrl(message: string = SITE.whatsappMessage) {
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
