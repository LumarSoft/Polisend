import { cn } from "@/lib/cn";

/**
 * Polisend mark: a chat bubble whose tail drops into the stem of a "P", with a
 * shield cut out of the bowl — WhatsApp conversation + póliza in one glyph.
 */
export const MARK_PATH =
  "M12 20A16 16 0 1 1 28 36H21.5L13.6 43.4C13 44 12 43.6 12 42.8Z" +
  "M28 11.5L34.5 13.9V20C34.5 24.2 31.7 27 28 28.6C24.3 27 21.5 24.2 21.5 20V13.9Z";

export function LogoMark({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="11 3 34 42"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path d={MARK_PATH} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-logo font-bold tracking-[-0.045em]",
        className,
      )}
    >
      <LogoMark className={cn("h-[1.15em] w-auto text-brand", markClassName)} />
      <span className="leading-none">polisend</span>
    </span>
  );
}
