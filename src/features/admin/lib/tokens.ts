/**
 * Plans and consumption are told in tokens to everyone but the Developer (decision of 17/11): 1 message the platform
 * sends = 1 token, a campaign message = 2 tokens. The API keeps its field names (`messages`, `includedMessages`,
 * `messagesUsed`, `consumedMessages`…): they already hold tokens. Prices and USD never reach these roles.
 */

/** The short rule shown next to every consumption view. */
export const TOKENS_HINT = '1 mensaje = 1 token · un mensaje de campaña = 2 tokens'

/** "1 token", "1.500 tokens". */
export function tokens(n: number): string {
  return `${n.toLocaleString('es-AR')} ${n === 1 ? 'token' : 'tokens'}`
}
