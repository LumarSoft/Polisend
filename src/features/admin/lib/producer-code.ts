/** A producer code (and a zone's code): letters, digits, "/" and "-", up to 20 (the API's rule; "2/12077" exists). */
const CODE_PATTERN = /^[A-Za-z0-9/-]{1,20}$/

export const CODE_HINT = 'El código solo admite letras, números, "/" y "-" (hasta 20).'

export function isValidCode(code: string): boolean {
  return CODE_PATTERN.test(code)
}
