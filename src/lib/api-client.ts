const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

/** An Owner's acting principal: sent on every request of its session, echoed by the API on each answer. */
export const ACTING_PRINCIPAL_HEADER = 'X-Acting-Principal'

/** `code` of the 403 the API answers when the Owner no longer reaches the principal it sent. */
export const ACTING_PRINCIPAL_INVALID = 'ACTING_PRINCIPAL_INVALID'

/** `code` of the 400 an Owner gets without the header on a tenant route (a panel bug: the client always sends it). */
export const ACTING_PRINCIPAL_REQUIRED = 'ACTING_PRINCIPAL_REQUIRED'

/** A file the API serves (an API-relative path like /uploads/...) as an absolute URL. */
export function apiAssetUrl(path: string): string {
  return path.startsWith('http') ? path : `${API_URL}${path}`
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** The API's machine-readable `code` (ACTING_PRINCIPAL_INVALID, EMAIL_RESTORABLE, TWO_FACTOR_LOCKED, …). */
    public readonly code?: string,
    /** The whole error body, for the few answers that carry more (e.g. `restorableUserId`). */
    public readonly body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * The answer came back for another principal than the one the request was sent for (or without saying which): it is
 * dropped instead of showing one principal's data under another's name.
 */
export class ActingPrincipalMismatchError extends ApiError {
  constructor(
    public readonly sent: number,
    public readonly received: string | null,
  ) {
    super(0, 'La respuesta era de otro principal y se descartó. Probá de nuevo.', 'ACTING_PRINCIPAL_MISMATCH')
    this.name = 'ActingPrincipalMismatchError'
  }
}

// ─── Listeners ─────────────────────────────────────────────────────────────────

type UnauthorizedListener = (token: string) => void
type ActingPrincipalListener = (principalId: number) => void

const unauthorizedListeners = new Set<UnauthorizedListener>()
const actingPrincipalInvalidListeners = new Set<ActingPrincipalListener>()
const actingPrincipalMismatchListeners = new Set<ActingPrincipalListener>()

/** Hears every request made with a token that the API answered 401 to, with that token. */
export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener)
  return () => {
    unauthorizedListeners.delete(listener)
  }
}

/** Hears every principal the API refused as an Owner's acting principal (403 ACTING_PRINCIPAL_INVALID or actingInvalid). */
export function onActingPrincipalInvalid(listener: ActingPrincipalListener): () => void {
  actingPrincipalInvalidListeners.add(listener)
  return () => {
    actingPrincipalInvalidListeners.delete(listener)
  }
}

/**
 * Hears every answer dropped because it did not come back for the principal it was sent for (no echo, or another
 * one). The API echoes only an Owner's principal: an account that stopped being an Owner (the Developer took it back
 * to SuperAdmin) gets answers without it, and only a fresh profile tells the panel to stop acting on a principal.
 */
export function onActingPrincipalMismatch(listener: ActingPrincipalListener): () => void {
  actingPrincipalMismatchListeners.add(listener)
  return () => {
    actingPrincipalMismatchListeners.delete(listener)
  }
}

/** For GET /users/me, which answers a refused principal with `actingInvalid: true` instead of a 403. */
export function reportActingPrincipalInvalid(principalId: number): void {
  actingPrincipalInvalidListeners.forEach(listener => listener(principalId))
}

function notifyUnauthorized(res: Response, token: string | null | undefined): void {
  if (res.status === 401 && token) unauthorizedListeners.forEach(listener => listener(token))
}

// ─── Acting principal ──────────────────────────────────────────────────────────

interface ActingPrincipalBinding {
  /** The session that chose it: requests made with any other token never carry it. */
  token: string
  principalId: number
}

let actingPrincipal: ActingPrincipalBinding | null = null

/**
 * The principal every request of an Owner's session carries in X-Acting-Principal (its choice, or its own principal
 * when none is chosen). Set by the panel's acting-principal provider for an OWNER only; null for every other role.
 */
export function setActingPrincipal(binding: ActingPrincipalBinding | null): void {
  actingPrincipal = binding
}

/** The principal a request made with this token would carry, or null. */
export function actingPrincipalFor(token: string | null | undefined): number | null {
  return token && actingPrincipal?.token === token ? actingPrincipal.principalId : null
}

// ─── Support ───────────────────────────────────────────────────────────────────

/** An Owner inside a SuperAdmin's or Admin's panel to help: the API answers every request as that user. */
export const SUPPORT_USER_HEADER = 'X-Support-User'
/** The API cannot answer as that user (gone, moved out of the Owner's network): the panel leaves support. */
export const SUPPORT_USER_INVALID = 'SUPPORT_USER_INVALID'
/** Something of the user's own account (its password, its two-step verification), never touched from support. */
export const SUPPORT_ROUTE_BLOCKED = 'SUPPORT_ROUTE_BLOCKED'

interface SupportBinding {
  /** The Owner's session: requests made with any other token never carry it. */
  token: string
  userId: number
}

let supportUser: SupportBinding | null = null
const supportInvalidListeners = new Set<() => void>()

/** The user every request of this session is answered as while the Owner gives support (SupportProvider); else null. */
export function setSupportUser(binding: SupportBinding | null): void {
  supportUser = binding
}

/** The user a request made with this token would be answered as, or null. */
export function supportUserFor(token: string | null | undefined): number | null {
  return token && supportUser?.token === token ? supportUser.userId : null
}

/** For GET /users/me, which answers a refused support user with `supportInvalid: true` instead of a 403. */
export function reportSupportUserInvalid(): void {
  supportInvalidListeners.forEach(listener => listener())
}

/** Hears the API refusing the user given support to (403 SUPPORT_USER_INVALID, or `supportInvalid` on /users/me). */
export function onSupportUserInvalid(listener: () => void): () => void {
  supportInvalidListeners.add(listener)
  return () => {
    supportInvalidListeners.delete(listener)
  }
}

// ─── Requests ──────────────────────────────────────────────────────────────────

interface PreparedRequest {
  headers: Record<string, string>
  /** Captured when the request is created: a later change of principal never alters it. */
  actingPrincipalId: number | null
}

/**
 * The one header builder of apiRequest, apiStream and apiDownload. `forPrincipal` replaces the acting principal for
 * this request only, and only in an Owner's session (every other session sends no principal at all).
 */
function prepareRequest(
  token: string | null | undefined,
  headers: Record<string, string> = {},
  forPrincipal?: number,
): PreparedRequest {
  // Giving support, the request is the user's: it never carries the Owner's acting principal.
  const support = supportUserFor(token)
  const acting = support !== null ? null : actingPrincipalFor(token)
  const actingPrincipalId = acting !== null && forPrincipal !== undefined ? forPrincipal : acting
  return {
    actingPrincipalId,
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(actingPrincipalId !== null ? { [ACTING_PRINCIPAL_HEADER]: String(actingPrincipalId) } : {}),
      ...(support !== null ? { [SUPPORT_USER_HEADER]: String(support) } : {}),
    },
  }
}

/**
 * One line of a validation 400. The API answers class-validator's errors as objects (`{ property, constraints,
 * children }`), not strings: their constraint texts are what is worth showing.
 */
function validationText(item: unknown): string {
  if (typeof item === 'string') return item
  if (!item || typeof item !== 'object') return ''
  const { constraints, children } = item as { constraints?: Record<string, unknown>; children?: unknown[] }
  const own = Object.values(constraints ?? {}).filter((text): text is string => typeof text === 'string')
  const nested = Array.isArray(children) ? children.map(validationText) : []
  return [...own, ...nested].filter(Boolean).join(', ')
}

async function readError(res: Response): Promise<ApiError> {
  let body: unknown
  try {
    body = await res.json()
  } catch {
    // response had no JSON body — fall through to the generic message
  }
  const data = (body && typeof body === 'object' ? body : {}) as { message?: unknown; code?: unknown }
  const joined = Array.isArray(data.message) ? data.message.map(validationText).filter(Boolean).join(', ') : ''
  const message = joined
    ? joined
    : typeof data.message === 'string'
      ? data.message
      : `Request failed with status ${res.status}`
  return new ApiError(res.status, message, typeof data.code === 'string' ? data.code : undefined, body)
}

/**
 * Throws the API's error for a failed answer, and drops an answer that is not of the principal the request was sent
 * for. `checkPrincipal: false` is only for GET /users/me, which reports a refused principal in its body.
 */
async function ensureResponse(
  res: Response,
  token: string | null | undefined,
  { actingPrincipalId }: PreparedRequest,
  checkPrincipal = true,
): Promise<void> {
  if (!res.ok) {
    notifyUnauthorized(res, token)
    const error = await readError(res)
    if (error.code === ACTING_PRINCIPAL_INVALID && actingPrincipalId !== null) {
      reportActingPrincipalInvalid(actingPrincipalId)
    }
    if (error.code === SUPPORT_USER_INVALID) supportInvalidListeners.forEach(listener => listener())
    throw error
  }
  if (!checkPrincipal || actingPrincipalId === null) return
  const received = res.headers.get(ACTING_PRINCIPAL_HEADER)
  if (received !== String(actingPrincipalId)) {
    actingPrincipalMismatchListeners.forEach(listener => listener(actingPrincipalId))
    throw new ActingPrincipalMismatchError(actingPrincipalId, received)
  }
}

/** `code` of the request the panel did not send because the Owner changed principal after starting it. */
export const ACTING_PRINCIPAL_CHANGED = 'ACTING_PRINCIPAL_CHANGED'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  token?: string | null
  body?: unknown
  /**
   * The acting principal the action was started in (`actingPrincipalFor(token)` when the person acted), for a write
   * created only after slow work in the browser (reading a file). If the Owner changed principal in between, the
   * request is not sent: it would carry the new principal and land one principal's data in another.
   */
  startedIn?: number | null
  /**
   * An Owner's request about one principal of its network other than the acting one (Consumo de la red: a number's
   * plan). Sent in X-Acting-Principal instead of the acting principal for this request only, so the panel stays on its
   * principal; the answer must echo it like any other. Ignored outside an Owner's session.
   */
  forPrincipal?: number
}

async function send(path: string, options: RequestOptions, checkPrincipal: boolean) {
  const { method = 'GET', token, body, startedIn, forPrincipal } = options
  // A FormData body (file uploads) goes as is: the browser sets the multipart
  // Content-Type with its boundary.
  const isForm = body instanceof FormData
  const prepared = prepareRequest(token, isForm ? {} : { 'Content-Type': 'application/json' }, forPrincipal)
  if (startedIn !== undefined && actingPrincipalFor(token) !== startedIn) {
    throw new ApiError(
      0,
      'Cambiaste de principal antes de que terminara: no se guardó nada. Hacelo de nuevo en este principal.',
      ACTING_PRINCIPAL_CHANGED,
    )
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: prepared.headers,
    ...(body !== undefined ? { body: isForm ? body : JSON.stringify(body) } : {}),
  })
  await ensureResponse(res, token, prepared, checkPrincipal)
  return { res, actingPrincipalId: prepared.actingPrincipalId }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { res } = await send(path, options, true)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

/**
 * An apiRequest that does not drop an answer without the acting-principal header, and says which principal it was
 * sent for. Only for GET /users/me: it ignores a refused principal and says so in its body (`actingInvalid`), and its
 * service checks the principal against the body (`actingProducerId`).
 */
export async function apiRequestReportingPrincipal<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; actingPrincipalId: number | null }> {
  const { res, actingPrincipalId } = await send(path, options, false)
  return { data: (await res.json()) as T, actingPrincipalId }
}

interface StreamOptions {
  token: string
  body: unknown
  signal?: AbortSignal
}

/**
 * A POST whose answer is a stream of server-sent events (the assistant): each
 * event goes to `onEvent` as it arrives. An HTTP error before the stream
 * starts throws an ApiError, like apiRequest.
 */
export async function apiStream<E extends { event: string; data: unknown }>(
  path: string,
  { token, body, signal }: StreamOptions,
  onEvent: (event: E) => void,
): Promise<void> {
  const prepared = prepareRequest(token, { 'Content-Type': 'application/json', Accept: 'text/event-stream' })
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: prepared.headers,
    body: JSON.stringify(body),
    signal,
  })
  await ensureResponse(res, token, prepared)
  if (!res.body) throw new ApiError(res.status, `Request failed with status ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let end: number
    while ((end = buffer.indexOf('\n\n')) >= 0) {
      const chunk = buffer.slice(0, end)
      buffer = buffer.slice(end + 2)
      let event = 'message'
      const data: string[] = []
      for (const line of chunk.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) data.push(line.slice(5).trimStart())
      }
      if (data.length) onEvent({ event, data: JSON.parse(data.join('\n')) as unknown } as E)
    }
  }
}

/** Downloads a file the API serves (a PDF) with the panel's token. */
export async function apiDownload(path: string, token: string): Promise<Blob> {
  const prepared = prepareRequest(token)
  const res = await fetch(`${API_URL}${path}`, { headers: prepared.headers })
  await ensureResponse(res, token, prepared)
  return res.blob()
}
