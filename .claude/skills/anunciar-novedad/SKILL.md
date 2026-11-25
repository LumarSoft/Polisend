---
name: anunciar-novedad
description: >-
  Anuncia una función nueva del panel de Polisend con el aviso que se abre una vez en su pantalla y su paso a paso
  (una mejora de «Mejoras» con pantalla y pasos). Usala SIEMPRE antes de commitear, abrir el PR o subir una función
  nueva o un cambio que la oficina ve o usa en el panel, sea en polisend, api_john o BOT_JPMG: primero se le
  pregunta a la persona si la sube con aviso. También cuando pida «anunciar», «avisarle a los usuarios», «novedad»,
  «paso a paso» o «tutorial» de algo que se hizo.
---

# Anunciar una novedad con aviso y paso a paso

**Cómo funciona.** Una mejora de Mejoras con pantalla (`screen`) y pasos (`steps`) se abre en el medio de esa
pantalla, sobre un blur, **una sola vez por navegador** (lo visto queda en el localStorage, porque varias personas
comparten una cuenta), durante los 30 días siguientes a publicarla. «Mostrame cómo» corre el paso a paso sobre la
pantalla real y marca cada elemento por su `data-help`. Después queda en Mejoras → «Paso a paso» para volver a verlo.
Código: `src/features/admin/lib/improvement-guides.ts`, `components/improvement-announcement.tsx`; API:
`GET /admin/improvements/guides`.

## 1. Preguntar, antes de subir

Cuándo: antes de commitear, abrir el PR o subir una función nueva, o un cambio visible, que usa la oficina
(SuperAdmin, Admin u Owner) en el panel. Vale aunque el cambio esté en api_john o en BOT_JPMG, si se ve o se usa
desde una pantalla del panel (algo nuevo del bot que se configura en Números, una acción nueva en Whatsapp).

No preguntes por arreglos que la oficina no nota, refactors, tests, documentación, pantallas que solo usa el
Developer (no ve avisos) ni por algo que la persona ya dijo que no anuncia.

Preguntá una sola vez por función, con AskUserQuestion:

> ¿Subimos «‹la función›» como novedad, con el aviso en ‹pantalla› y su paso a paso?

- **Sí, con aviso y paso a paso** → seguí desde el punto 2.
- **No, subirla sin aviso** → subila normal y no crees ningún aviso.

## 2. Preparar el código, en el mismo PR de la función

- Cada elemento que el paso a paso va a marcar lleva `data-help="‹id›"` (minúsculas con guiones: `chat-nuevo`,
  `tarea-crear`). Antes, buscá si ya existe uno (`grep -rn 'data-help=' src`) y reusalo.
- Si la función está en una pantalla nueva, sumala a `SCREENS` (`lib/panel-screens.ts`, y a `PANEL_SCREENS` de
  api_john `src/assistant/panel-guide.ts`, como dice su comentario) y a `GUIDE_SCREENS`
  (`lib/improvement-guides.ts`).
- Si la función vive solo en api_john o BOT_JPMG, los `data-help` van en un PR de polisend; si el elemento no
  existe en el panel, el paso va sin elemento.

## 3. Redactar la mejora y que la persona la apruebe

Primero buscá si ya hay una mejora sobre lo mismo (en el editor de Mejoras, o `GET /platform/improvements`). Si
existe, se le suma el aviso a esa («Editar»), no se crea otra: si no, en Mejoras quedan dos iguales.

El borrador que le mostrás:

- **Área** (Bot de WhatsApp, Whatsapp, Cotizador, Panel o Portal de clientes), **fecha** (la del deploy) y
  **organización**: todas, o una sola si la función es solo de esa. Si dudás, preguntá.
- **Título** (hasta 140) y **resumen** (hasta 500): para la oficina, sin términos técnicos, en castellano
  rioplatense. **Antes**, **Ahora** y **Ejemplo** son opcionales.
- **Pantalla del aviso**: la de la función (un id de `GUIDE_SCREENS`).
- **Pasos** (hasta 6), cada uno con:
  - título (hasta 80, una acción: «Tocá «Nuevo chat»»);
  - texto (hasta 400: qué pasa ahí o cómo se usa);
  - elemento (`data-help`), o ninguno para que se vea en el medio de la pantalla.
- «Avanza cuando lo toca» va solo si tocar el elemento abre un diálogo o un menú que marca el paso siguiente.
  Adentro de un diálogo, todos los pasos menos el último avanzan así, porque tocar «Siguiente» en la burbuja
  cuenta como tocar afuera y lo cierra.
- Un elemento que aparece solo en algunos casos (un botón adentro de un chat viejo) va mejor sin elemento,
  explicado en el texto.

Mostrá el borrador entero y esperá el OK o los cambios. No publiques sin eso.

## 4. Publicarla, recién con la función en producción

El aviso sale apenas se publica: si la función todavía no está en producción, los pasos marcan cosas que no
existen. Primero se mergea y se espera el deploy (api_john antes que polisend cuando cambia la API; polisend lo
publica Vercel). Después:

1. Abrí https://polisend.com.ar/admin/mejoras con una cuenta **Developer**, en el navegador de la persona donde ya
   tiene la sesión (Claude in Chrome con el perfil que corresponda). **Nunca escribas una contraseña**: si aparece
   el login, pedile a la persona que entre y esperá.
2. «Nueva mejora» (o «Editar» en la que ya existía): completá los campos y el bloque «Aviso y paso a paso». Mirá la
   vista previa de la derecha.
3. «Guardar y publicar» (o «Guardar cambios» si ya estaba publicada).
4. Comprobá que la tarjeta muestre «Aviso en ‹pantalla› · N pasos».

## 5. Contarle cómo quedó

Decile a la persona:

- que quedó publicada, en qué pantalla y para qué organización;
- que cada persona la ve una vez por navegador durante 30 días, y después queda en Mejoras → «Paso a paso»;
- que la cuenta Developer no entra a las pantallas de la oficina: para verla, hay que abrir esa pantalla con una
  cuenta de la oficina.
