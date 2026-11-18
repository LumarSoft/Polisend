/**
 * Marks the assistant's round button. It can sit above an open sheet or dialog
 * (the record open there is what the assistant is asked about), and touching it
 * must not count as a click outside that closes the sheet: the dialog and sheet
 * primitives keep themselves open for anything inside this attribute.
 */
export const ASSISTANT_LAUNCHER_ATTRIBUTE = 'data-assistant-launcher'

/** Whether an event outside a sheet or dialog came from the assistant's button. */
export function fromAssistantLauncher(event: {
  detail?: { originalEvent?: Event }
  target: EventTarget | null
}): boolean {
  const target = event.detail?.originalEvent?.target ?? event.target
  return target instanceof Element && target.closest(`[${ASSISTANT_LAUNCHER_ATTRIBUTE}]`) !== null
}
