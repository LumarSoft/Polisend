"use client";

import { useEffect, useRef, type RefObject } from "react";

interface Bubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  s: number;
  a: number;
  volt: boolean;
  fade: number;
}

/**
 * Canvas of tiny chat bubbles drifting in from the edges and converging on the
 * target (the phone): hundreds of insureds, one WhatsApp, all answered.
 */
export function MessageField({
  targetRef,
  className,
}: {
  targetRef: RefObject<HTMLElement | null>;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // The field is desktop-only (hidden below lg); don't spend frames on it.
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    let w = 0;
    let h = 0;
    let tx = 0;
    let ty = 0;
    let raf = 0;
    let visible = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const t = targetRef.current?.getBoundingClientRect();
      if (t) {
        tx = t.left - rect.left + t.width / 2;
        ty = t.top - rect.top + t.height * 0.45;
      } else {
        tx = w * 0.72;
        ty = h * 0.5;
      }
    };

    const spawn = (b?: Bubble): Bubble => {
      const edge = Math.random();
      let x: number;
      let y: number;
      if (edge < 0.55) {
        x = -20;
        y = Math.random() * h;
      } else if (edge < 0.78) {
        x = Math.random() * w;
        y = -20;
      } else {
        x = Math.random() * w;
        y = h + 20;
      }
      const bubble = b ?? ({} as Bubble);
      Object.assign(bubble, {
        x,
        y,
        vx: 0,
        vy: 0,
        s: 0.6 + Math.random() * 1.1,
        a: 0,
        volt: Math.random() < 0.14,
        fade: 0,
      });
      return bubble;
    };

    measure();
    const count = w < 700 ? 34 : 80;
    const bubbles = Array.from({ length: count }, () => {
      const b = spawn();
      b.x = Math.random() * w * 0.85;
      b.y = Math.random() * h;
      return b;
    });

    const draw = (b: Bubble) => {
      const bw = 11 * b.s;
      const bh = 8 * b.s;
      ctx.globalAlpha = b.a * (1 - b.fade);
      ctx.fillStyle = b.volt ? "#1f4fe0" : "#0b1526";
      ctx.beginPath();
      ctx.roundRect(b.x - bw / 2, b.y - bh / 2, bw, bh, 3 * b.s);
      ctx.moveTo(b.x - bw / 2 + 1.5 * b.s, b.y + bh / 2 - 1);
      ctx.lineTo(b.x - bw / 2, b.y + bh / 2 + 3 * b.s);
      ctx.lineTo(b.x - bw / 2 + 4 * b.s, b.y + bh / 2 - 1);
      ctx.fill();
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      for (const b of bubbles) {
        const dx = tx - b.x;
        const dy = ty - b.y;
        const dist = Math.hypot(dx, dy) || 1;
        const pull = 0.018 + (1.6 - b.s) * 0.01;
        b.vx = b.vx * 0.965 + (dx / dist) * pull + Math.sin(b.y * 0.01) * 0.006;
        b.vy = b.vy * 0.965 + (dy / dist) * pull + Math.cos(b.x * 0.01) * 0.006;
        b.x += b.vx;
        b.y += b.vy;
        b.a = Math.min(b.volt ? 0.55 : 0.12, b.a + 0.01);
        if (dist < 150) b.fade = Math.min(1, b.fade + 0.05);
        if (b.fade >= 1) spawn(b);
        draw(b);
      }
      ctx.globalAlpha = 1;
    };

    const ro = new ResizeObserver(measure);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(canvas);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [targetRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className ?? "pointer-events-none absolute inset-0 size-full"}
    />
  );
}
