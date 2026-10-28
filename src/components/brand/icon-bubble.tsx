import type { ComponentType } from "react";
import type { IconProps } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

/** Rounded chat bubble whose tail drops to the bottom-left, like the logo's "P". */
const BUBBLE =
  "M12 0H28A12 12 0 0 1 40 12V24A12 12 0 0 1 28 36H14L5 41.6C4.2 42.1 3.2 41.4 3.4 40.5L5.1 33.8A12 12 0 0 1 0 24V12A12 12 0 0 1 12 0Z";

const TONES = {
  brand: { bubble: "text-brand", icon: "text-on-brand", weight: "fill" },
  soft: { bubble: "text-canvas-4", icon: "text-brand", weight: "duotone" },
  dark: { bubble: "text-fg", icon: "text-on-brand", weight: "fill" },
} as const;

/** Icon set inside the Polisend speech-bubble tile, so every icon reads as part of the brand. */
export function IconBubble({
  icon: Icon,
  tone = "brand",
  size = 40,
  className,
}: {
  icon: ComponentType<IconProps>;
  tone?: keyof typeof TONES;
  size?: number;
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <span
      aria-hidden
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: size, height: (size * 42) / 40 }}
    >
      <svg viewBox="0 0 40 42" className={cn("absolute inset-0 size-full", t.bubble)}>
        <path d={BUBBLE} fill="currentColor" />
      </svg>
      <Icon
        weight={t.weight}
        className={cn("absolute top-[43%] left-1/2 -translate-x-1/2 -translate-y-1/2", t.icon)}
        style={{ width: size * 0.52, height: size * 0.52 }}
      />
    </span>
  );
}
