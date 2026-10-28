import { FAQ } from "@/components/sections/faq";
import { FEATURES } from "@/lib/product";
import { SITE } from "@/lib/site";

/**
 * /llms.txt (llmstxt.org): a plain-markdown brief so AI assistants can
 * describe Polisend accurately and link to the right section.
 */
export function GET() {
  const messages = SITE.messagesPerPlan.toLocaleString("es-AR");
  const body = `# ${SITE.name}

> ${SITE.name} es un bot de WhatsApp con inteligencia artificial y un panel de gestión para productores asesores de seguros de Argentina. Atiende a los asegurados las 24 horas: los identifica por DNI o patente, toma denuncias de siniestro con fotos, informa cuotas, envía la documentación de la póliza y cotiza auto y moto en tiempo real. Lo desarrolla ${SITE.company} en ${SITE.city}, ${SITE.region}.

## Para quién es

Productores asesores de seguros (PAS) y productoras que atienden a sus asegurados por WhatsApp y quieren responder al instante, a cualquier hora, sin sumar personal.

## Qué hace

${FEATURES.map((f) => `- ${f}`).join("\n")}

## Cómo responde

- Los trámites críticos (siniestros, pagos, documentos, identificación) usan flujos guiados con botones y listas, sin IA: respuesta inmediata y datos reales de la póliza.
- La IA conversacional se usa para cotizar y responder dudas en lenguaje natural; no inventa precios ni coberturas.
- Si el asegurado pide una persona, el bot se pausa y el equipo sigue la conversación desde el inbox del panel.

## Integraciones

- Compañías: ${SITE.insurers.join(" y ")} (cartera, cuotas, documentación y cotizador).
- WhatsApp: API oficial de WhatsApp Business (Meta).
- Catálogo de vehículos: InfoAuto.

## Precio

USD ${SITE.priceUsd} por mes por cada ${messages} mensajes. Incluye el bot, el panel, la integración con la compañía y la puesta en marcha.

## Preguntas frecuentes

${FAQ.map((f) => `### ${f.q}\n\n${f.a}`).join("\n\n")}

## Enlaces

- [Inicio](${SITE.url}/): presentación del producto
- [Denuncia de siniestro de punta a punta](${SITE.url}/#historia)
- [Funciones del bot](${SITE.url}/#bot)
- [Panel de gestión](${SITE.url}/#panel)
- [Precio](${SITE.url}/#precio)
- [Preguntas frecuentes](${SITE.url}/#faq)
- [Contacto por WhatsApp](https://wa.me/${SITE.whatsappNumber}): ${SITE.phoneDisplay}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
