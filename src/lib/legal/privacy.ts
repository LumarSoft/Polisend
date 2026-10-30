import type { LegalDocument } from "./types";

/**
 * Polisend's privacy policy (Ley 25.326). The productora decides about its
 * insureds' data and Lumarsoft processes it on its behalf; Lumarsoft decides
 * about the panel's users. Also the "data deletion instructions" Meta asks for
 * (#eliminar-datos).
 */
export const PRIVACY: LegalDocument = {
  title: "Política de",
  highlight: "privacidad.",
  intro:
    "Qué datos tratamos en Polisend, para qué los usamos, con quién los compartimos y cómo pedir que los eliminemos. Escrito para que se entienda, sin letra chica.",
  updated: "30 de octubre de 2026",
  sections: [
    {
      id: "quienes-somos",
      title: "1. Quiénes somos y a quién aplica",
      paragraphs: [
        "Polisend es un servicio de Lumarsoft, con domicilio en Rosario, Santa Fe, Argentina. Ofrece a productores asesores de seguros y a sus productoras un asistente de WhatsApp y un panel de gestión.",
        "Esta política alcanza a dos grupos de personas: quienes usan el panel (los productores y su equipo) y quienes escriben a un número de WhatsApp conectado a Polisend (asegurados, clientes potenciales y otros contactos de cada productora).",
      ],
    },
    {
      id: "responsable",
      title: "2. Quién decide sobre tus datos",
      items: [
        {
          term: "Si le escribís a una productora",
          detail:
            "La productora con la que hablás es la responsable de tus datos. Polisend los trata por cuenta de ella, solo para prestarle el servicio y siguiendo sus instrucciones. Para ejercer tus derechos podés dirigirte a la productora o a nosotros, y la vamos a ayudar a responderte.",
        },
        {
          term: "Si usás el panel",
          detail:
            "Lumarsoft es la responsable de los datos de tu cuenta de usuario y de los de la productora como cliente del servicio.",
        },
      ],
    },
    {
      id: "datos",
      title: "3. Qué datos tratamos",
      items: [
        {
          term: "Cuenta de usuario",
          detail: "Nombre, correo electrónico, rol y contraseña. La contraseña se guarda cifrada: nadie puede leerla.",
        },
        {
          term: "Datos de la productora",
          detail:
            "Razón social, códigos de productor, números de WhatsApp, horarios, textos del asistente y credenciales de acceso a las compañías aseguradoras, que se guardan cifradas.",
        },
        {
          term: "Números de WhatsApp conectados",
          detail:
            "Los identificadores que Meta asigna al número y a su cuenta, y un permiso de acceso que se guarda cifrado. Si el número sigue usando la app WhatsApp Business, también el historial reciente de chats y los contactos que la productora autoriza a sincronizar al conectarlo.",
        },
        {
          term: "Conversaciones",
          detail:
            "Los mensajes que se intercambian por WhatsApp con el asistente o con el equipo de la productora, incluidas las fotos, audios y documentos.",
        },
        {
          term: "Datos de asegurados",
          detail:
            "Nombre, DNI, teléfono, correo, pólizas, vehículos y bienes asegurados, cuotas, vencimientos y siniestros. Vienen de las compañías aseguradoras con las que opera la productora o de lo que el asegurado informa.",
        },
        {
          term: "Uso del servicio",
          detail: "La cantidad de mensajes enviados por cada número, que se usa para facturar el plan.",
        },
        {
          term: "Navegación",
          detail: "Información técnica básica necesaria para que el sitio y el panel funcionen y se mantengan seguros.",
        },
      ],
    },
    {
      id: "finalidad",
      title: "4. Para qué los usamos",
      list: [
        "Responder por WhatsApp a quienes escriben a la productora, de forma automática o a través de su equipo.",
        "Identificar al asegurado y darle información de sus pólizas, cuotas y siniestros.",
        "Tomar denuncias de siniestro, pedidos de baja y solicitudes de cotización, y cotizar con las compañías.",
        "Mostrarle al equipo de la productora sus conversaciones, asuntos pendientes, cobranzas y vencimientos.",
        "Facturarle a cada productora el plan de cada número.",
        "Mantener el servicio seguro y resolver problemas técnicos.",
      ],
    },
    {
      id: "fundamento",
      title: "5. Con qué fundamento",
      paragraphs: [
        "Tratamos los datos para cumplir el contrato del servicio con cada productora y, en el caso de los asegurados, con el consentimiento que prestan al escribir a su productora o al darle sus datos, en los términos de la Ley 25.326 de Protección de los Datos Personales.",
      ],
    },
    {
      id: "terceros",
      title: "6. Con quién los compartimos",
      paragraphs: [
        "No vendemos ni cedemos datos. Los compartimos solo con quienes necesitamos para prestar el servicio:",
      ],
      items: [
        {
          term: "Compañías aseguradoras",
          detail:
            "Los datos necesarios para cotizar, consultar la cartera o gestionar una póliza viajan a la compañía que corresponda, que los trata bajo su propia política.",
        },
        {
          term: "Meta Platforms (WhatsApp)",
          detail:
            "Los mensajes viajan por la Plataforma de WhatsApp Business de Meta, que actúa como proveedor del canal y se rige además por las políticas de WhatsApp y de Meta.",
        },
        {
          term: "Proveedor de inteligencia artificial",
          detail:
            "Para redactar algunas respuestas del asistente enviamos el texto de la conversación a un proveedor de modelos de lenguaje, que no usa esa información para entrenar sus modelos.",
        },
        {
          term: "Infraestructura y correo",
          detail:
            "Nuestros servidores, bases de datos y el envío de avisos por correo están en proveedores que actúan como encargados y no pueden usar los datos para fines propios.",
        },
        {
          term: "Autoridades",
          detail: "Cuando una ley o un requerimiento judicial nos obligue.",
        },
      ],
    },
    {
      id: "no-hacemos",
      title: "7. Qué no hacemos",
      list: [
        "No vendemos datos ni los cedemos con fines comerciales.",
        "No los usamos para publicidad propia ni para armar audiencias.",
        "No cruzamos datos entre productoras: cada una tiene su propio espacio y no puede ver el de las demás.",
        "No le escribimos a nadie por WhatsApp sin que haya escrito primero o le haya dado su número a la productora para que lo contacte.",
      ],
    },
    {
      id: "conservacion",
      title: "8. Cuánto tiempo los conservamos",
      paragraphs: [
        "Las conversaciones, audios y archivos de WhatsApp se borran automáticamente cuando dejan de ser útiles para dar seguimiento. Los datos de la productora y de sus asegurados se conservan mientras la productora use el servicio.",
        "Si la productora deja Polisend, le entregamos sus datos si los pide y los eliminamos dentro de los 30 días siguientes, salvo los que una ley nos obligue a conservar.",
      ],
    },
    {
      id: "seguridad",
      title: "9. Cómo los protegemos",
      paragraphs: [
        "Las comunicaciones con el sitio, el panel y la API viajan cifradas. Las contraseñas, los permisos de acceso de WhatsApp y las credenciales de las compañías se guardan cifrados. Cada usuario del panel ve solo lo que corresponde a su rol y a sus códigos de productor, y el equipo de Lumarsoft accede solo para dar soporte.",
        "Ningún sistema es infalible. Si un incidente de seguridad afectara datos personales, vamos a avisar a las productoras afectadas y actuar conforme a la normativa vigente.",
      ],
    },
    {
      id: "eliminar-datos",
      title: "10. Cómo pedir que eliminemos tus datos",
      paragraphs: [
        "Productoras: pueden desconectar un número de WhatsApp desde el panel (Números) o desde la app WhatsApp Business del celular (Configuración → Cuenta → Business Platform → Desconectar). Para eliminar la cuenta y todos sus datos, escribinos a cualquiera de los contactos de abajo.",
        "Asegurados y contactos: pedile a tu productora que elimine tus datos, o escribinos directamente indicando el número de WhatsApp desde el que escribiste y la productora. Vamos a pedirte que acredites tu identidad.",
        "Respondemos dentro de los 10 días hábiles y completamos la eliminación dentro de los 30 días, salvo los datos que una ley nos obligue a conservar.",
      ],
    },
    {
      id: "derechos",
      title: "11. Tus derechos",
      paragraphs: [
        "Podés pedir el acceso, la rectificación, la actualización y la supresión de tus datos personales escribiendo a cualquiera de los contactos de abajo.",
        "EL TITULAR DE LOS DATOS PERSONALES TIENE LA FACULTAD DE EJERCER EL DERECHO DE ACCESO A LOS MISMOS EN FORMA GRATUITA A INTERVALOS NO INFERIORES A SEIS MESES, SALVO QUE SE ACREDITE UN INTERÉS LEGÍTIMO AL EFECTO, CONFORME LO ESTABLECIDO EN EL ARTÍCULO 14, INCISO 3 DE LA LEY Nº 25.326.",
        "LA AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, EN SU CARÁCTER DE ÓRGANO DE CONTROL DE LA LEY Nº 25.326, TIENE LA ATRIBUCIÓN DE ATENDER LAS DENUNCIAS Y RECLAMOS QUE INTERPONGAN QUIENES RESULTEN AFECTADOS EN SUS DERECHOS POR INCUMPLIMIENTO DE LAS NORMAS VIGENTES EN MATERIA DE PROTECCIÓN DE DATOS PERSONALES.",
      ],
    },
    {
      id: "cambios",
      title: "12. Cambios en esta política",
      paragraphs: [
        "Podemos actualizar esta política cuando cambie el servicio o la normativa. La versión vigente es siempre la publicada en esta página, con su fecha de última actualización.",
      ],
    },
  ],
};
