/**
 * Polisend's mark: a chat bubble whose tail drops into the stem of a "P", with a
 * shield cut out of the bowl. Same drawing as the landing (Polisend repo).
 */
export const MARK_PATH =
  'M12 20A16 16 0 1 1 28 36H21.5L13.6 43.4C13 44 12 43.6 12 42.8Z' +
  'M28 11.5L34.5 13.9V20C34.5 24.2 31.7 27 28 28.6C24.3 27 21.5 24.2 21.5 20V13.9Z'

/** The mark's own viewBox: it is taller than wide. */
export const MARK_VIEWBOX = '11 3 34 42'

interface BrandMarkProps {
  size?: number
  className?: string
}

/** Polisend's mark on its blue tile. */
export function BrandMark({ size = 36, className = '' }: BrandMarkProps) {
  return (
    <span
      role="img"
      aria-label="Polisend"
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center bg-polisend text-on-polisend ${className}`}
    >
      <svg viewBox={MARK_VIEWBOX} aria-hidden style={{ height: size * 0.62, width: 'auto' }}>
        <path d={MARK_PATH} fill="currentColor" fillRule="evenodd" />
      </svg>
    </span>
  )
}
