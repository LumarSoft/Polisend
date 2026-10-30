import type { LegalDocument } from "./types";

/** Polisend's terms of service: what the productora contracts from Lumarsoft. */
export const TERMS: LegalDocument = {
  title: "Términos del",
  highlight: "servicio.",
  intro:
    "Las reglas del servicio entre Lumarsoft y cada productora que contrata Polisend: qué incluye, cómo se factura y qué esperamos de cada parte.",
  updated: "30 de octubre de 2026",
  sections: [
    {
      id: "servicio",
      title: "1. El servicio",
      paragraphs: [
        "Polisend es un servicio de Lumarsoft (Rosario, Santa Fe, Argentina) para productores asesores de seguros y productoras: un asistente que atiende por WhatsApp a los asegurados y un panel de gestión para el equipo. Al contratarlo o usarlo, la productora acepta estos términos.",
      ],
    },
    {
      id: "cuentas",
      title: "2. Cuentas y usuarios",
      list: [
        "Cada productora tiene una cuenta con uno o más usuarios. Quien la administra decide qué ve cada usuario.",
        "Las credenciales son personales. La productora responde por lo que se haga con las cuentas de su equipo y nos avisa si cree que alguna fue comprometida.",
        "Los datos que se cargan (horarios, textos del asistente, credenciales de las compañías) tienen que ser correctos y la productora tiene que estar autorizada a usarlos.",
      ],
    },
    {
      id: "whatsapp",
      title: "3. Números de WhatsApp",
      list: [
        "Cada número se conecta a la Plataforma de WhatsApp Business de Meta desde el panel. El número y su cuenta de WhatsApp son de la productora.",
        "La productora cumple las políticas de WhatsApp Business y de Meta: le escribe a quien la contactó o le dio su número, y respeta los pedidos de no recibir más mensajes.",
        "Meta puede limitar o suspender un número por su calidad o por incumplir sus políticas. Esas decisiones son de Meta y no dependen de Lumarsoft.",
      ],
    },
    {
      id: "planes",
      title: "4. Planes, precios y facturación",
      list: [
        "Cada número tiene un plan de mensajes por mes, del catálogo publicado en este sitio. Cuenta cada mensaje que envía el asistente, el equipo desde el panel o un aviso automático; no cuentan los mensajes que escriben los clientes ni los que se mandan desde la app del celular.",
        "Los planes incluyen el costo de WhatsApp de esos mensajes. Las campañas de marketing por plantilla no están incluidas y se cotizan aparte.",
        "Cuando un número llega a los mensajes que incluye su plan, su asistente deja de responder automáticamente y la productora recibe un aviso. Puede elegir pasarlo al plan siguiente, que se cobra desde ese mes, o dejarlo en pausa hasta el mes siguiente. Los mensajes se siguen recibiendo y la oficina puede contestarlos desde el panel.",
        "El primer mes de un número de una cuenta nueva puede incluir un plan de prueba gratuito, si está publicado.",
        "Se factura a mes vencido, en dólares estadounidenses, dentro de los primeros días del mes siguiente. Un número activo paga su plan aunque no envíe mensajes.",
        "Podemos cambiar los planes y sus precios avisando con al menos 30 días de anticipación.",
      ],
    },
    {
      id: "uso",
      title: "5. Uso aceptable",
      list: [
        "No usar Polisend para enviar mensajes no solicitados, engañosos o ilegales.",
        "No intentar acceder a datos de otras productoras ni vulnerar la seguridad del servicio.",
        "No revender el servicio sin un acuerdo escrito con Lumarsoft.",
        "Podemos suspender un número o una cuenta que incumpla estas reglas o ponga en riesgo el servicio para el resto, avisando a la productora.",
      ],
    },
    {
      id: "datos",
      title: "6. Datos de los asegurados y confidencialidad",
      paragraphs: [
        "La productora es la responsable de los datos de sus asegurados y Lumarsoft los trata por cuenta de ella, solo para prestar el servicio, con las medidas de la Política de privacidad. Ninguna de las partes usa la información confidencial de la otra para otro fin.",
      ],
    },
    {
      id: "ia",
      title: "7. Respuestas automáticas e inteligencia artificial",
      paragraphs: [
        "El asistente responde con flujos guiados y, en algunos casos, con inteligencia artificial. Puede equivocarse: no reemplaza el asesoramiento del productor, y la productora supervisa lo que el asistente dice en su nombre desde el panel, donde puede tomar cualquier conversación.",
      ],
    },
    {
      id: "terceros",
      title: "8. Compañías y servicios de terceros",
      paragraphs: [
        "Polisend se integra con compañías aseguradoras, Meta, un proveedor de inteligencia artificial y otros servicios. Si alguno no está disponible o cambia sus condiciones, la función que depende de él puede verse limitada mientras dure el problema.",
      ],
    },
    {
      id: "disponibilidad",
      title: "9. Disponibilidad y soporte",
      paragraphs: [
        "Trabajamos para que Polisend funcione todo el tiempo, pero puede haber interrupciones por mantenimiento, fallas o causas ajenas. Damos soporte por los canales de contacto de este sitio.",
      ],
    },
    {
      id: "responsabilidad",
      title: "10. Responsabilidad",
      paragraphs: [
        "Lumarsoft responde por los daños directos que cause por su culpa, hasta el total que la productora haya pagado por el servicio en los tres meses anteriores al hecho. No responde por lucro cesante ni por daños causados por terceros, por Meta, por las compañías o por un uso del servicio contrario a estos términos.",
      ],
    },
    {
      id: "baja",
      title: "11. Baja",
      paragraphs: [
        "Cualquiera de las partes puede terminar el servicio avisando con 30 días de anticipación. Se factura el último mes de uso. Durante los 30 días siguientes la productora puede pedir una copia de sus datos; después se eliminan, salvo los que una ley obligue a conservar.",
      ],
    },
    {
      id: "cambios",
      title: "12. Cambios en estos términos",
      paragraphs: [
        "Podemos actualizar estos términos. Si el cambio es importante, avisamos a las productoras con 30 días de anticipación. La versión vigente es la publicada en esta página.",
      ],
    },
    {
      id: "ley",
      title: "13. Ley aplicable",
      paragraphs: [
        "Estos términos se rigen por las leyes de la República Argentina. Cualquier diferencia se resuelve ante los tribunales ordinarios de la ciudad de Rosario, Santa Fe.",
      ],
    },
  ],
};
