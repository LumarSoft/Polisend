/**
 * Commercial constants for the landing. The sales WhatsApp number comes from
 * NEXT_PUBLIC_WHATSAPP_NUMBER (international format, digits only, e.g.
 * 5493412776893); defaults to the Polisend sales line.
 */
export const SITE = {
  name: "Polisend",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://polisend.com",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5493412776893",
  whatsappMessage:
    "¡Hola! Quiero Polisend para mi productora de seguros. ¿Me cuentan cómo arrancamos?",
  priceUsd: 60,
  messagesPerPlan: 1000,
  insurers: ["Triunfo Seguros", "Sancor Seguros"],
} as const;

export function whatsappUrl(message: string = SITE.whatsappMessage) {
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
