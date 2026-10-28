import type { ChatScenario, ChatStep, ListSheet } from "./types";

/*
 * Every flow below mirrors a real Polisend path (identification by DNI or
 * plate, account statement, documents, online quote, claim report with
 * photos). Names, plates, amounts and times are fictitious.
 */

const BOT = "Sofía";
const ORG = "Tu Productora";

export const CLIENT_MENU: ListSheet = {
  title: "Ver opciones",
  rows: [
    { emoji: "🛡️", title: "Siniestros", desc: "Denunciar o consultar un siniestro" },
    { emoji: "💰", title: "Cotización", desc: "Cotizar un seguro" },
    { emoji: "💳", title: "Pagos y cobranzas", desc: "Estado de cuenta y cuotas" },
    { emoji: "📄", title: "Documentación", desc: "Tarjeta, póliza, certificado, cupón" },
    { emoji: "🆘", title: "Auxilio / Grúa", desc: "Número de asistencia" },
    { emoji: "👤", title: "Hablar con un asesor", desc: "Te contacta un asesor" },
  ],
};

export const HERO_SCENARIOS: ChatScenario[] = [
  {
    label: "Domingo · 22:47 · Pagos",
    clock: "22:47",
    hold: 3800,
    steps: [
      { do: "add", delay: 600, msg: { id: "a1", kind: "out", time: "22:47", text: "hola! cuánto debo del seguro del auto?" } },
      { do: "typing", delay: 450 },
      { do: "add", delay: 1000, msg: { id: "a2", kind: "in", time: "22:47", text: `¡Hola! Soy *${BOT}*, la asistente de *${ORG}* 👋\nPasame tu *DNI* o la *patente* y lo busco.` } },
      { do: "add", delay: 1700, msg: { id: "a3", kind: "out", time: "22:47", text: "AB123CD" } },
      { do: "typing", delay: 350 },
      { do: "add", delay: 850, msg: { id: "a4", kind: "event", text: "Cliente identificado · Lucía G." } },
      { do: "add", delay: 450, msg: { id: "a5", kind: "buttons", time: "22:47", text: "¡Listo, Lucía! Tenés *1 cuota pendiente*:\n\n🚗 *Peugeot 208* · Póliza 0041\nCuota 10/12 · vence *05/11*\nImporte: *$ 48.300*\n\n¿Te mando el cupón de pago?", buttons: ["Sí, mandámelo", "Volver al menú"] } },
      { do: "pick", delay: 1900, id: "a5", index: 0 },
      { do: "add", delay: 450, msg: { id: "a6", kind: "out", time: "22:48", text: "Sí, mandámelo" } },
      { do: "typing", delay: 300 },
      { do: "add", delay: 900, msg: { id: "a7", kind: "doc", time: "22:48", name: "Cupón de pago · Póliza 0041.pdf", meta: "PDF · directo de la compañía" } },
      { do: "add", delay: 650, msg: { id: "a8", kind: "in", time: "22:48", text: "Ahí lo tenés 🙌 ¿Te ayudo con algo más?" } },
    ],
  },
  {
    label: "Lunes · 07:12 · Cotización",
    clock: "07:12",
    hold: 4200,
    steps: [
      { do: "add", delay: 600, msg: { id: "b1", kind: "out", time: "07:12", text: "buenas! cuánto sale asegurar un cronos 2021?" } },
      { do: "typing", delay: 450 },
      { do: "add", delay: 1000, msg: { id: "b2", kind: "in", time: "07:12", text: "¡Buen día! Te lo cotizo al toque 🚗\n¿Es el *Cronos 1.3 Drive* o el *1.3 Precision*?" } },
      { do: "add", delay: 1500, msg: { id: "b3", kind: "out", time: "07:12", text: "1.3 Drive" } },
      { do: "typing", delay: 350 },
      { do: "add", delay: 800, msg: { id: "b4", kind: "in", time: "07:12", text: "¿En qué localidad o código postal lo guardás?" } },
      { do: "add", delay: 1400, msg: { id: "b5", kind: "out", time: "07:13", text: "Rosario, 2000" } },
      { do: "typing", delay: 350 },
      { do: "add", delay: 800, msg: { id: "b6", kind: "buttons", time: "07:13", text: "Último dato: ¿tu auto tiene GNC?", buttons: ["Sí, tiene GNC", "No tiene GNC"] } },
      { do: "pick", delay: 1500, id: "b6", index: 1 },
      { do: "add", delay: 400, msg: { id: "b7", kind: "out", time: "07:13", text: "No tiene GNC" } },
      { do: "typing", delay: 300 },
      {
        do: "add",
        delay: 1200,
        msg: {
          id: "b8",
          kind: "quote",
          time: "07:13",
          title: "Fiat Cronos 1.3 Drive · 2021",
          rows: [
            { name: "Responsabilidad Civil", price: "$ 38.900" },
            { name: "Todo Total", price: "$ 52.600" },
            { name: "Terceros Completo", price: "$ 67.300" },
            { name: "Todo Riesgo", price: "$ 118.500" },
          ],
          note: "Precio de la compañía en tiempo real · por mes · sujeto a inspección.",
        },
      },
      { do: "add", delay: 900, msg: { id: "b9", kind: "in", time: "07:13", text: "¿Con cuál avanzamos? Un asesor te la deja lista 🙌" } },
    ],
  },
];

/** The 07:40 → 07:44 claim report, driven by scroll in the story section. */
export const STORY_STEPS: ChatStep[] = [
  { do: "add", msg: { id: "s1", kind: "out", time: "07:40", text: "Hola, me acaban de chocar 😣" } },
  { do: "typing" },
  { do: "add", msg: { id: "s2", kind: "in", time: "07:40", text: `¡Hola! Soy *${BOT}*, de *${ORG}* 👋 Pasame tu *DNI* o la *patente* y te busco.` } },
  { do: "add", msg: { id: "s3", kind: "out", time: "07:40", text: "AB123CD" } },
  { do: "clock", time: "07:41" },
  { do: "add", msg: { id: "s4", kind: "event", text: "Cliente identificado · Lucía G." } },
  { do: "add", msg: { id: "s5", kind: "list", time: "07:41", text: "¡Hola de nuevo, Lucía! ¿En qué te doy una mano?", button: "Ver opciones" } },
  { do: "sheet", sheet: CLIENT_MENU },
  { do: "sheetPick", index: 0 },
  { do: "sheet", sheet: null },
  { do: "add", msg: { id: "s6", kind: "buttons", time: "07:41", text: "🛡️ *Denuncia de siniestro*\n¿Qué póliza está involucrada?", buttons: ["Peugeot 208 · AB123CD", "Honda Wave · A123BCD"] } },
  { do: "pick", id: "s6", index: 0 },
  { do: "clock", time: "07:42" },
  { do: "add", msg: { id: "s7", kind: "in", time: "07:42", text: "¿Cuándo y cómo pasó? Contame con detalle." } },
  { do: "add", msg: { id: "s8", kind: "out", time: "07:42", text: "Hoy 7:35. Me chocaron de atrás en un semáforo, rompieron el paragolpes" } },
  { do: "add", msg: { id: "s9", kind: "buttons", time: "07:42", text: "Confirmá la denuncia:\n🚗 Peugeot 208 · hoy 07:35\n📝 Choque trasero en semáforo", buttons: ["Confirmar", "Cancelar"] } },
  { do: "pick", id: "s9", index: 0 },
  { do: "clock", time: "07:43" },
  { do: "add", msg: { id: "s10", kind: "in", time: "07:43", text: "📸 Mandame tu *tarjeta verde*, tu *registro*, los datos del *tercero* y fotos del *daño*." } },
  { do: "add", msg: { id: "s11", kind: "photo", variant: "card", label: "Tarjeta verde", time: "07:43" } },
  { do: "add", msg: { id: "s12", kind: "photo", variant: "license", label: "Registro", time: "07:43" } },
  { do: "add", msg: { id: "s13", kind: "photo", variant: "card", label: "Tarjeta · tercero", time: "07:44" } },
  { do: "add", msg: { id: "s14", kind: "photo", variant: "damage", label: "Daño · trasero", time: "07:44" } },
  { do: "clock", time: "07:44" },
  { do: "typing" },
  { do: "add", msg: { id: "s15", kind: "in", time: "07:44", text: "✅ *Denuncia registrada.* Ya la tiene un asesor del equipo, con las 4 fotos." } },
  { do: "add", msg: { id: "s16", kind: "event", text: "07:44 · Denuncia cargada en el panel" } },
];

/** Narrative chapters, each starting when the message with that id appears. */
export const STORY_CHAPTERS = [
  { from: "s1", title: "Tu cliente chocó.", body: "Son las 7:40. Tu oficina abre a las 8:00. El primer mensaje no va a la compañía: va a tu WhatsApp." },
  { from: "s3", title: "Sabe con quién habla.", body: "Con el DNI o la patente, el bot ya tiene enfrente sus pólizas, sus vehículos y su estado de cuenta." },
  { from: "s6", title: "La denuncia, paso a paso.", body: "Qué póliza, cuándo y qué pasó. Botones y preguntas cortas, sin formularios ni llamadas." },
  { from: "s10", title: "Con todas las fotos.", body: "Tarjeta, registro, datos del tercero y fotos del daño quedan adjuntos a la denuncia." },
  { from: "s15", title: "7:44. Cargada.", body: "La denuncia entra al panel y a tu mail con todo adjunto. La persiana todavía está baja." },
];
