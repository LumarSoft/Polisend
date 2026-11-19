import { isScreenId, screenHref } from './panel-screens'
import { isTourId, type TourId } from './panel-tours'

/** A piece of a line of the assistant's reply. */
export interface ReplyInline {
  text: string
  bold: boolean
  /** Set when the piece is a link to a client's file (`asegurado:123`). */
  clientId?: number
  /** Set when the piece is the button of an on-screen guide (`recorrido:cargar-rechazos`). */
  tourId?: TourId
  /** Set when the piece is a button to a screen of the panel (`pantalla:config-horarios`). */
  screenId?: string
  /** The record that screen opens (`pantalla:numero-pagos/12`). */
  recordId?: number
  /** A value written between backticks (an alias, a CBU): shown as a value to copy. */
  code?: boolean
  /** Set when the piece is a suggested next step (`preguntar:`): tapping it asks its text. */
  ask?: boolean
}

/**
 * A block of the reply: a paragraph (its lines, kept apart), a bulleted or
 * numbered list (one line per item), a heading, or a table.
 */
export type ReplyBlock =
  | { kind: 'paragraph' | 'list' | 'ordered'; lines: ReplyInline[][] }
  | { kind: 'heading'; level: 1 | 2 | 3; lines: ReplyInline[][] }
  | { kind: 'table'; header: ReplyInline[][]; rows: ReplyInline[][][]; align: ReplyAlign[] }

/** How a table column lines up: numbers to the right, so digits fall under digits. */
export type ReplyAlign = 'left' | 'right' | 'center'

/** The longest a question can be, as the API takes it. */
export const MAX_QUESTION = 2000

const LIST_ITEM = /^\s*[-*•]\s+/
const ORDERED_ITEM = /^\s*\d+[.)]\s+/
const HEADING = /^\s*(#{1,3})\s+(.+?)\s*#*$/
const TABLE_ROW = /^\s*\|.*\|\s*$/
const TABLE_RULE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/
/** A cell that is a figure: an amount, a count, a percentage, a date. */
const FIGURE_CELL = /^[\s$*~≈+\-−]*[\d.,]+\s*(%|millones|M|mil)?\**\s*$/
const BOLD = /\*\*(.+?)\*\*/g
const CODE = /`([^`]+)`/g
const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g
const CLIENT_LINK = /^asegurado:(\d+)$/
const TOUR_LINK = /^recorrido:([a-z-]+)$/
const SCREEN_LINK = /^pantalla:([a-z0-9-]+)(?:\/(\d+))?$/
const ASK_LINK = /^preguntar:/

/**
 * The assistant's reply as blocks of plain pieces, so the panel renders it
 * with its own elements and never as HTML: `**negrita**`, `- ` lists, line
 * breaks, `[nombre](asegurado:ID)` links, `[Ir a …](pantalla:ID)` screens and
 * `[Mostrame en pantalla](recorrido:ID)` guides the panel has, and
 * `[Texto](preguntar:)` suggestions of a next step. Any other link is plain text.
 */
export function parseReply(reply: string): ReplyBlock[] {
  const blocks: ReplyBlock[] = []
  let current: Extract<ReplyBlock, { kind: 'paragraph' | 'list' | 'ordered' }> | null = null
  const lines = reply.replace(/\r\n/g, '\n').split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd()
    if (!line.trim()) {
      current = null
      continue
    }
    // A table: a row of cells, its rule (|---|---:|) and the rows under it.
    if (TABLE_ROW.test(line) && TABLE_RULE.test(lines[i + 1] ?? '')) {
      const header = cellsOf(line)
      const align = cellsOf(lines[i + 1], true).map(alignOf)
      const rows: string[][] = []
      i += 2
      while (i < lines.length && TABLE_ROW.test(lines[i])) rows.push(cellsOf(lines[i++]))
      i -= 1
      blocks.push({
        kind: 'table',
        header: header.map(parseInline),
        rows: rows.map(row => header.map((_, c) => parseInline(row[c] ?? ''))),
        align: header.map(
          (_, c) => align[c] ?? (rows.length && rows.every(row => FIGURE_CELL.test(row[c] ?? '')) ? 'right' : 'left'),
        ),
      })
      current = null
      continue
    }
    const heading = HEADING.exec(line)
    if (heading) {
      blocks.push({ kind: 'heading', level: heading[1].length as 1 | 2 | 3, lines: [parseInline(heading[2])] })
      current = null
      continue
    }
    const kind = LIST_ITEM.test(line) ? 'list' : ORDERED_ITEM.test(line) ? 'ordered' : 'paragraph'
    if (!current || current.kind !== kind) {
      current = { kind, lines: [] }
      blocks.push(current)
    }
    const text =
      kind === 'list' ? line.replace(LIST_ITEM, '') : kind === 'ordered' ? line.replace(ORDERED_ITEM, '') : line.trim()
    current.lines.push(parseInline(text))
  }
  return blocks
}

/** The cells of a table row, without the outer pipes. */
function cellsOf(row: string, keepColons = false): string[] {
  const inner = row.trim().replace(/^\|/, '').replace(/\|$/, '')
  return inner.split('|').map(cell => (keepColons ? cell.trim() : cell.trim()))
}

/** A column's alignment from its rule cell (`:--`, `--:`, `:-:`); none given, undefined. */
function alignOf(rule: string): ReplyAlign | undefined {
  const left = rule.startsWith(':')
  const right = rule.endsWith(':')
  if (left && right) return 'center'
  if (right) return 'right'
  if (left) return 'left'
  return undefined
}

/** A line as plain text, links and marks gone: what "Copiar" puts on the clipboard. */
export function plainReply(reply: string): string {
  return reply
    .replace(/\[([^\]]+)\]\((?:asegurado|recorrido|pantalla|preguntar):[^)]*\)/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim()
}

function parseInline(line: string): ReplyInline[] {
  const pieces: ReplyInline[] = []
  let last = 0
  for (const match of line.matchAll(CODE)) {
    pieces.push(...parseBold(line.slice(last, match.index)))
    pieces.push({ text: match[1], bold: false, code: true })
    last = match.index + match[0].length
  }
  pieces.push(...parseBold(line.slice(last)))
  return pieces.filter(p => p.text)
}

function parseBold(text: string): ReplyInline[] {
  const pieces: ReplyInline[] = []
  let last = 0
  for (const match of text.matchAll(BOLD)) {
    pieces.push(...parseLinks(text.slice(last, match.index), false))
    pieces.push(...parseLinks(match[1], true))
    last = match.index + match[0].length
  }
  pieces.push(...parseLinks(text.slice(last), false))
  return pieces
}

function parseLinks(text: string, bold: boolean): ReplyInline[] {
  const pieces: ReplyInline[] = []
  let last = 0
  for (const match of text.matchAll(LINK)) {
    pieces.push({ text: text.slice(last, match.index), bold })
    pieces.push(linkPiece(match[1], match[2], bold))
    last = match.index + match[0].length
  }
  pieces.push({ text: text.slice(last), bold })
  return pieces
}

function linkPiece(text: string, target: string, bold: boolean): ReplyInline {
  const client = CLIENT_LINK.exec(target)
  if (client) return { text, bold, clientId: Number(client[1]) }
  const tour = TOUR_LINK.exec(target)?.[1]
  if (tour && isTourId(tour)) return { text, bold, tourId: tour }
  const screen = SCREEN_LINK.exec(target)
  if (screen && isScreenId(screen[1])) {
    return { text, bold, screenId: screen[1], ...(screen[2] ? { recordId: Number(screen[2]) } : {}) }
  }
  if (ASK_LINK.test(target)) return { text: text.trim(), bold, ask: true }
  return { text, bold }
}

/** Whether a line is only suggestions: the panel lays those out as a row of buttons. */
export function isSuggestionLine(line: ReplyInline[]): boolean {
  const pieces = line.filter(piece => piece.text.trim())
  return pieces.length > 0 && pieces.every(piece => piece.ask)
}

/** Where a client link of the reply goes: Asegurados with that client's file open. */
export function clientHref(clientId: number): string {
  return `/admin/asegurados?cliente=${clientId}`
}

/** Where a screen link of the reply goes: the screen, its tab and section, and the record it opens. */
export function replyScreenHref(piece: Pick<ReplyInline, 'screenId' | 'recordId'>): string {
  return screenHref(piece.screenId ?? 'inicio', piece.recordId)
}
