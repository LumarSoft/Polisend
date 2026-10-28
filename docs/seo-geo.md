# Auditoría SEO y GEO — landing de Polisend

Fecha: 27/10/2026 · Alcance: la landing (una sola página, español de Argentina), en su build de producción.
**GEO** (*Generative Engine Optimization*) es el trabajo para que los motores de IA (ChatGPT, Perplexity, Google AI Overviews, Gemini, Claude) entiendan el producto, lo citen y lo recomienden.

> No hay herramientas SEO conectadas (Ahrefs o Semrush), así que los volúmenes y las dificultades de las palabras clave son estimaciones cualitativas a partir de búsquedas web y de la competencia visible. Para tener cifras reales, conectar el plugin de Ahrefs (`/mcp`) o cargar las palabras clave en Google Keyword Planner.

---

## 1. Resumen ejecutivo

La base técnica quedó **sólida**:

- La página es HTML estático, con todo el texto disponible sin ejecutar JavaScript, que es lo que leen los crawlers de IA.
- Tiene un único H1 con la palabra clave principal y una jerarquía de títulos ordenada.
- Tiene datos estructurados completos, `robots.txt`, `sitemap.xml` y un `llms.txt` para asistentes de IA.
- Lighthouse da **100 en SEO, accesibilidad y buenas prácticas**. El LCP real en móvil es de 2,0 s, dentro del rango "bueno" de Google.

La mayor fortaleza es el contenido: casi 2.800 palabras indexables, específicas y verificables sobre un nicho (productores asesores de seguros) donde casi no hay competencia directa con buen SEO.

**Las tres prioridades:**

1. **Dar de alta el sitio en Google Search Console y Bing Webmaster Tools** (hoy `polisend.vercel.app`; idealmente con un dominio propio, que el sitio toma solo al conectarlo en Vercel). Sin esto, nada de lo anterior se aprovecha. Bing importa porque es el índice que usa ChatGPT para buscar en la web.
2. **Crear presencia fuera del sitio**: perfil de LinkedIn, Google Business Profile, directorios de software y menciones en medios y asociaciones de productores. Los motores de IA recomiendan marcas que ven citadas en varias fuentes, no solo en su propia web.
3. **Sumar páginas por intención de búsqueda** (denuncia de siniestros por WhatsApp, productores de Triunfo, precios, caso de éxito). Una sola landing compite por una sola familia de búsquedas.

---

## 2. Qué se corrigió en esta auditoría

| Área | Antes | Ahora |
|---|---|---|
| Título | "Polisend — Tu WhatsApp atiende solo…" (sin palabra clave) | **"Bot de WhatsApp para productores de seguros \| Polisend"** (54 caracteres) |
| Meta descripción | 200+ caracteres (se cortaba en Google) | 159 caracteres, con palabra clave y beneficios |
| H1 | Solo el slogan | "Bot de WhatsApp con IA para productores asesores de seguros. Tu WhatsApp atiende solo, y sabe con quién habla." (el diseño no cambia) |
| Títulos de sección | 3 bloques sin título (historia, "el bot se calla", cierre) | Todas las secciones con H2; preguntas frecuentes con H3; etiquetas con palabras clave ("Denuncia de siniestro por WhatsApp", "Panel de gestión para tu productora", etc.) |
| Canonical / `og:url` | No había | `https://<dominio>/` |
| `robots.txt` / `sitemap.xml` | 404 | Generados; permiten todos los crawlers, incluidos los de IA |
| Datos estructurados | Ninguno | JSON-LD: Organization (con Lumarsoft, Rosario, contacto de ventas), WebSite, SoftwareApplication (funciones, público, área, **precio USD 60/mes cada 1.000 mensajes**) y FAQPage (11 preguntas) |
| `llms.txt` | No había | `/llms.txt`: resumen en Markdown del producto, funciones, precio, integraciones y preguntas frecuentes |
| Preguntas frecuentes | 8, todas operativas | 11. Se sumaron "¿Qué es Polisend?", "¿Cómo funciona la denuncia de siniestros por WhatsApp?" y "¿Necesito WhatsApp Business?", que responden en forma directa lo que preguntan las personas y los motores de IA |
| Identidad de marca | Footer genérico | Frase-entidad: "Polisend es el bot de WhatsApp con IA y el panel de gestión para productores asesores de seguros de Argentina. Un producto de Lumarsoft, hecho en Rosario." |
| Íconos / PWA | Solo favicon SVG | Más `apple-icon` PNG 180 px, `manifest.webmanifest` y alt descriptivo en la imagen para compartir |
| Velocidad (LCP) | 4,1 s simulado: el texto de la portada esperaba al JavaScript para mostrarse | El texto se pinta en el primer cuadro con animación CSS. LCP real: **2,0 s** en móvil con limitación real; 0,8 s en desktop |
| JavaScript en móvil | El canvas de partículas corría aunque estaba oculto | Solo corre en desktop |
| Fuentes | Instrument Serif en normal e itálica | Solo itálica, que es la única que se usa |
| Accesibilidad | 92: contraste bajo y `aria-label` inválidos | **100**: contraste AA, `aria-label` solo en títulos y orden de títulos correcto |

**Lighthouse (build de producción):**

| | Rendimiento | Accesibilidad | Buenas prácticas | SEO |
|---|---|---|---|---|
| Móvil, antes | 75 | 92 | 100 | 100 |
| Móvil, ahora | 79–80 | **100** | 100 | 100 |
| Desktop, ahora | **100** | **100** | 100 | 100 |

En móvil, el rendimiento queda en 80 por el **tiempo de bloqueo del hilo principal**: el JavaScript de las animaciones (GSAP, partición de títulos, secciones fijas) suma 0,8 s con CPU limitada. No afecta la indexación, pero sí la métrica INP (qué tan rápido responde la página al tocar). Está en el plan como mejora técnica.

---

## 3. Oportunidades de palabras clave

Estimaciones cualitativas para Argentina. "Dificultad" refleja quién ocupa hoy los resultados: blogs de proveedores de chatbots genéricos (Cliengo, WATI, Aurorainbox, Chattigo) y apps de aseguradoras. No hay un líder específico para productores.

| Palabra clave | Dificultad est. | Oportunidad | Posición actual | Intención | Contenido recomendado |
|---|---|---|---|---|---|
| bot de whatsapp para productores de seguros | Baja | **Alta** | Sin indexar aún | Comercial | Home (ya optimizada) |
| chatbot para productores de seguros | Baja | **Alta** | Sin indexar aún | Comercial | Home + página de funciones |
| denuncia de siniestro por whatsapp (lado productor) | Baja | **Alta** | — | Comercial | Landing dedicada `/denuncia-de-siniestros-por-whatsapp` |
| whatsapp para productores de seguros | Media | **Alta** | — | Informativa / comercial | Guía pilar |
| bot whatsapp triunfo seguros / productores triunfo | Baja | **Alta** | — | Comercial | Landing `/productores-triunfo` |
| software para productores asesores de seguros | Media | **Alta** | — | Comercial | Página de producto + comparativa |
| asistente virtual para productora de seguros | Baja | Media | — | Comercial | Home / funciones |
| automatizar whatsapp productora de seguros | Baja | Media | — | Informativa | Artículo de blog |
| cotizador de seguros por whatsapp | Media | Media | — | Comercial | Landing del cotizador |
| crm para productores de seguros | Media-alta | Media | — | Comercial | Página "Panel" (aclarar que no es un CRM completo) |
| inteligencia artificial para productores de seguros | Baja (en crecimiento) | Media | — | Informativa | Artículo de blog / opinión |
| cómo atender clientes de seguros por whatsapp | Baja | Media | — | Informativa | Artículo de blog |
| recordatorio de renovación de pólizas por whatsapp | Baja | Media | — | Informativa / comercial | Artículo + función de renovaciones |
| cobranza de cuotas de seguros por whatsapp | Baja | Media | — | Comercial | Artículo + sección de cobranzas |
| api de whatsapp business para seguros | Media | Media | — | Informativa | Guía técnica |
| plantillas de mensajes de whatsapp para productores | Baja | Media | — | Informativa | Recurso descargable (captación) |
| cómo digitalizar una productora de seguros | Baja | Media | — | Informativa | Guía pilar |
| herramientas para productores asesores de seguros | Media | Baja | — | Informativa | Listado / recopilación |
| software para brokers de seguros argentina | Alta | Baja | — | Comercial | Comparativa (más adelante) |
| polisend | Baja | Alta (marca) | — | Navegacional | Home, perfiles sociales y directorios |

---

## 4. Problemas on-page

| Página | Problema | Severidad | Estado / solución |
|---|---|---|---|
| Home | El título no tenía la palabra clave | Alta | ✅ Corregido |
| Home | Meta descripción de más de 160 caracteres | Media | ✅ Corregido |
| Home | Sin canonical ni `og:url` | Alta | ✅ Corregido (usa el dominio de producción de Vercel) |
| Home | H1 sin palabra clave | Alta | ✅ Corregido sin cambiar el diseño |
| Home | Secciones sin H2 | Media | ✅ Corregido |
| Home | Sin datos estructurados | Alta | ✅ Corregido |
| Home | Títulos de sección muy creativos y con pocas palabras clave | Media | ✅ Etiquetas descriptivas arriba de cada título; los títulos creativos se mantienen |
| Home | Texto de la portada oculto hasta que cargaba el JavaScript | Alta | ✅ Corregido (animación CSS) |
| Home | Contraste insuficiente en textos secundarios | Media | ✅ Corregido |
| Home | Enlaces internos limitados (una sola página) | Media | ⏳ Se resuelve al crear páginas por intención |
| Home | Sin fecha de actualización visible | Baja | ⏳ Opcional: "Actualizado: octubre 2026" en el footer |
| Sitio | Sin testimonios ni casos reales | Alta para GEO | ⏳ Requiere permiso de clientes |

---

## 5. Checklist técnico

| Chequeo | Estado | Detalle |
|---|---|---|
| Dominio configurado | ✅ Pasa | Toma automáticamente el dominio de producción de Vercel (hoy `polisend.vercel.app`, y el dominio propio cuando se conecte). `NEXT_PUBLIC_SITE_URL` lo fuerza si hace falta. Antes apuntaba a `polisend.com`, que no existe, y por eso los links compartidos salían sin imagen |
| HTTPS | ⚠️ Pendiente | Depende del hosting (Vercel lo da automático) |
| robots.txt | ✅ Pasa | Permite todo, apunta al sitemap |
| sitemap.xml | ✅ Pasa | Actualizar `SITE.lastUpdated` en `src/lib/site.ts` cuando cambie el contenido |
| Canonical | ✅ Pasa | |
| Meta robots | ✅ Pasa | index, follow, max-image-preview: large |
| Datos estructurados | ✅ Pasa | Validar en producción con [Rich Results Test](https://search.google.com/test/rich-results) y [Schema Validator](https://validator.schema.org/) |
| Open Graph / Twitter | ✅ Pasa | Imagen 1200×630 propia |
| Idioma | ✅ Pasa | `lang="es-AR"`, `og:locale es_AR` |
| Contenido sin JavaScript | ✅ Pasa | HTML estático: los crawlers de IA que no ejecutan JS leen todo |
| Mobile | ✅ Pasa | Viewport correcto, sin scroll horizontal, revisado a 360 px |
| LCP | ✅ Pasa | 2,0 s en móvil (limitación real), 0,8 s en desktop |
| CLS | ✅ Pasa | 0 |
| TBT / INP | ⚠️ Mejorable | 0,36–0,8 s en móvil por JS de animaciones |
| Enlaces rotos | ✅ Pasa | Anclas internas y `wa.me` |
| Search Console | ⚠️ Pendiente | Variable `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` lista; falta el token |
| Bing Webmaster Tools | ⚠️ Pendiente | Clave para ChatGPT (usa el índice de Bing); se puede importar desde Search Console |
| Analítica | ⚠️ Pendiente | No hay medición. Recomendado: Vercel Analytics o GA4, más eventos en los botones "Quiero Polisend" |
| llms.txt | ✅ Pasa | `/llms.txt` |
| Crawlers de IA | ✅ Pasa | No se bloquea ninguno (GPTBot, OAI-SearchBot, PerplexityBot, Google-Extended, etc.) |

---

## 6. GEO: cómo hacer que la IA recomiende Polisend

**Ya hecho en el código**

- Respuestas directas y citables: "¿Qué es Polisend?" con una definición en la primera oración, funciones concretas, precio explícito y cómo funciona la denuncia.
- La misma información en tres formatos: HTML visible, JSON-LD y `llms.txt`.
- Frase de entidad consistente: qué es, para quién, quién lo hace y dónde.
- Datos verificables, sin superlativos vacíos ni cifras inventadas.

**Pendiente (fuera del código), por impacto**

1. **Presencia consistente de la marca**: página de LinkedIn de Polisend, Google Business Profile (de Lumarsoft o de Polisend), y fichas en Capterra / GetApp / ComparaSoftware con la misma descripción del footer. Los motores generativos cruzan fuentes.
2. **Menciones de terceros**: notas o columnas en medios del sector (por ejemplo, Todo Riesgo, Estrategas, 100% Seguro), charlas o acuerdos con asociaciones de productores (FAPASA, asociaciones regionales de PAS). Es lo que más pesa para que ChatGPT y Perplexity recomienden una marca.
3. **Caso de éxito real** (con permiso del cliente, o anonimizado): "Productora de Rosario con cientos de asegurados: denuncias cargadas antes de abrir la oficina". Sin datos personales.
4. **Medir y publicar métricas propias**: hoy el sistema no mide tiempo de respuesta ni porcentaje resuelto sin intervención humana. Agregar esa medición permite publicar datos reales ("X % de consultas resueltas sin intervención"), que son de lo que más citan los motores de IA.
5. **Video demo** en YouTube (la historia 7:40 → 7:44) con título y descripción optimizados y transcripción. Google y Gemini muestran YouTube en sus respuestas.
6. **Bing**: dar de alta el sitio y usar IndexNow; ChatGPT busca en ese índice.

**Riesgo a revisar:** la integración con **Sancor** figura en la página, en los datos estructurados y en `llms.txt`, pero hoy solo existe la de Triunfo. Los asistentes de IA van a repetir esa afirmación como un hecho. Conviene marcarla como "próximamente" hasta que esté disponible, o tenerla lista antes de difundir el sitio.

---

## 7. Competencia

No hay un competidor directo con un producto igual y SEO fuerte. El espacio lo ocupan tres tipos de jugadores:

| Dimensión | Polisend | Cliengo / WATI / Aurorainbox (chatbots genéricos con contenido sobre seguros) | PASAP (app para PAS) | Apps de aseguradoras (Galeno PAS, Experta) |
|---|---|---|---|---|
| Producto específico para PAS por WhatsApp | ✅ Sí | ❌ Genérico, se adapta | Parcial (gestión, sin bot) | ❌ De una sola compañía |
| Integración con compañías | Triunfo (+ Sancor anunciado) | No | Varias compañías | La propia |
| Contenido / blog | ❌ Una página | ✅ Mucho (guías "WhatsApp para seguros") | Poco | Poco |
| Autoridad de dominio | Nueva | Alta | Baja-media | Alta (marca de la aseguradora) |
| Datos estructurados | ✅ Completos | Variable | — | — |
| Precio público | ✅ Sí | Variable | — | Gratis para sus productores |
| Ganador hoy en búsquedas genéricas | | ✅ | | |
| Ganador potencial en búsquedas de nicho | ✅ | | | |

**Lectura:** competir por "chatbot WhatsApp seguros" contra blogs genéricos es caro. El camino es dominar el nicho específico (productores, denuncias, Triunfo, cobranzas, renovaciones), donde nadie responde con un producto real.

---

## 8. Plan de acción

### Victorias rápidas (esta semana)

| Acción | Impacto | Esfuerzo | Depende de |
|---|---|---|---|
| Conectar un dominio propio en Vercel (el sitio lo toma solo) | Alto | 15 min | Comprar el dominio |
| Publicar en Vercel (HTTPS) | Alto | — | ✅ Hecho: polisend.vercel.app |
| Alta en Google Search Console + enviar sitemap + token en `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Alto | 30 min | Publicación |
| Alta en Bing Webmaster Tools (importar desde Search Console) | Alto (ChatGPT) | 15 min | Search Console |
| Validar JSON-LD en Rich Results Test y Schema Validator | Medio | 15 min | Publicación |
| Página de LinkedIn de Polisend con la frase de entidad del footer | Alto (GEO) | 1 h | — |
| Decidir cómo se presenta Sancor ("próximamente" o integración lista) | Alto (confianza) | 10 min | Decisión comercial |
| Analítica + evento en los botones de WhatsApp | Medio | 1 h | Publicación |

### Inversiones estratégicas (este trimestre)

| Acción | Impacto | Esfuerzo | Depende de |
|---|---|---|---|
| Landing `/denuncia-de-siniestros-por-whatsapp` | Alto | Medio día | — |
| Landing `/productores-triunfo` (y Sancor cuando exista) | Alto | Medio día | — |
| Página `/precios` con ejemplos por volumen de mensajes | Medio | Medio día | Definir tramos |
| Guía pilar "WhatsApp para productores de seguros" + 4–6 artículos (renovaciones, cobranzas, fuera de horario, API de WhatsApp Business, plantillas) | Alto | Varios días | — |
| Caso de éxito real | Alto (GEO y conversión) | 1 día | Permiso del cliente |
| Fichas en Capterra / GetApp / ComparaSoftware | Medio-alto | 2 h | Página de LinkedIn |
| Notas en medios del sector y vínculo con asociaciones de PAS | Alto (GEO) | Continuo | Caso de éxito |
| Video demo en YouTube con transcripción | Medio | 1 día | — |
| Medir tiempo de respuesta y % resuelto sin humano en la API para publicar datos reales | Alto (GEO) | 1–2 días | Desarrollo en la API |
| Reducir el JS de animaciones en móvil (cargar las secciones fijas cuando se acercan, partir menos títulos) | Medio (INP) | Medio día | — |

---

## Fuentes consultadas sobre la competencia

- [Cliengo: Guía WhatsApp Business para seguros](https://guiawabusiness.cliengo.com/whatsapp-seguros)
- [Aurorainbox: chatbot de WhatsApp para agencias de seguros](https://www.aurorainbox.com/2025/06/01/chatbot-whatsapp-agencias-seguros-cotizaciones-siniestros/)
- [WATI: WhatsApp para aseguradoras](https://www.wati.io/es/blog/whatsapp-para-aseguradoras/)
- [CM.com: chatbots de WhatsApp para aseguradoras](https://www.cm.com/es-es/blog/como-chatbots-de-whatsapp-para-aseguradoras-mejoran-la-atencion-al-cliente/)
- [Chattigo: chatbots en el sector seguros](https://blog.chattigo.com/chatbots/chatbot-para-empresas-una-tendencia-en-el-sector-de-seguros)
- [PASAP (App Store)](https://mwm.ai/apps/pasap/1513244843)
- [Galeno Seguros: app para productores asesores](https://mercado.com.ar/protagonistas/galeno-seguros-nueva-app-para-productores-asesores)
- [Experta ART: App Productores](https://apps.apple.com/us/app/id1179563713)
- [El Cronista: aseguradoras argentinas que usan IA](https://www.cronista.com/infotechnology/innovacion-it/las-aseguradoras-argentinas-que-usan-ia-para-vender-prevenir-y-resolver-mas-rapido)
