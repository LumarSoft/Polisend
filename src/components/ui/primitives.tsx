"use client";

import {
  useRef,
  type ElementType,
  type PointerEvent,
  type ReactNode,
} from "react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { gsap, MOTION_OK, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { whatsappUrl } from "@/lib/site";
import { cn } from "@/lib/cn";

/** Primary CTA: opens the sales WhatsApp with a prefilled message. Magnetic on fine pointers. */
export function CtaButton({
  children = "Quiero Polisend",
  message,
  size = "md",
  className,
  variant = "primary",
}: {
  children?: ReactNode;
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "primary" | "dark";
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    gsap.to(ref.current, {
      x: (e.clientX - r.left - r.width / 2) * 0.18,
      y: (e.clientY - r.top - r.height / 2) * 0.28,
      duration: 0.5,
    });
  };
  const onLeave = () =>
    ref.current &&
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1,0.4)" });

  return (
    <a
      ref={ref}
      href={whatsappUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn(
        "group relative inline-flex items-center gap-3 overflow-hidden rounded-full font-semibold tracking-tight whitespace-nowrap transition-[box-shadow,background-color] duration-500 will-change-transform",
        variant === "primary"
          ? "bg-brand text-on-brand shadow-[0_0_0_0_rgb(31_79_224/0.5)] hover:shadow-[0_0_40px_-4px_rgb(31_79_224/0.7)]"
          : "bg-canvas text-fg hover:bg-canvas-4",
        size === "sm" && "h-10 px-4 text-[13.5px] sm:pr-1.5 sm:pl-4.5",
        size === "md" && "h-13 pr-2 pl-6 text-[15px]",
        size === "lg" && "h-16 pr-2.5 pl-8 text-[18px]",
        className,
      )}
    >
      <span>{children}</span>
      <span
        className={cn(
          "grid place-items-center rounded-full transition-transform duration-500 ease-out-expo group-hover:rotate-45",
          variant === "primary" ? "bg-canvas text-brand" : "bg-brand text-on-brand",
          size === "sm" ? "hidden size-7 sm:grid" : size === "md" ? "size-9" : "size-11",
        )}
      >
        <ArrowUpRight weight="bold" className="size-4" />
      </span>
    </a>
  );
}

export function Eyebrow({
  as: Tag = "p",
  children,
  className,
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Tag className={cn("text-[15px] font-medium tracking-[-0.01em] text-brand", className)}>
      {children}
    </Tag>
  );
}

/** Heading whose lines rise out of a mask when scrolled into view. */
export function SplitReveal({
  as: Tag = "h2",
  children,
  className,
  start = "top 94%",
  delay = 0,
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  start?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const split = SplitText.create(ref.current, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit(self) {
            gsap.set(ref.current, { autoAlpha: 1 });
            return gsap.from(self.lines, {
              yPercent: 110,
              rotate: 2,
              duration: 0.8,
              stagger: 0.06,
              delay,
              ease: "expo.out",
              scrollTrigger: { trigger: ref.current, start, once: true },
            });
          },
        });
        return () => split.revert();
      });
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref} data-split className={className}>
      {children}
    </Tag>
  );
}

/**
 * Fades up every [data-reveal] descendant as it enters the viewport. One per
 * page; elements start hidden via CSS (with a no-JS / reduced-motion escape).
 */
export function Reveals() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 96%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.06,
            ease: "expo.out",
            overwrite: true,
          }),
      });
    });
  });
  return null;
}
