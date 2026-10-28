"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/**
 * Scrolls to a pinned, scroll-driven section and keeps going through its pin so
 * the story plays by itself. Any wheel/touch input replaces Lenis' animation,
 * so the visitor takes over the moment they scroll.
 */
function autoplay(lenis: Lenis, section: HTMLElement) {
  lenis.scrollTo(section, {
    duration: 1.2,
    onComplete: () => {
      const spacer = section.parentElement;
      if (!spacer?.classList.contains("pin-spacer")) return;
      const pinLength = spacer.offsetHeight - section.offsetHeight;
      const top = spacer.getBoundingClientRect().top + window.scrollY;
      // Stop just after the story completes, while the section is still pinned.
      lenis.scrollTo(top + pinLength * 0.94, {
        duration: Math.min(10, Math.max(6, pinLength / 230)),
        easing: easeInOutSine,
      });
    },
  });
}

/**
 * Lenis smooth scroll driven by GSAP's ticker so ScrollTrigger scrubs stay in
 * lockstep with the eased scroll position. Skipped entirely for reduced motion.
 * Also routes in-page anchor links through Lenis.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lenis = reduce
      ? null
      : new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4) });

    let tick: ((time: number) => void) | null = null;
    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      tick = (time) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
        'a[href^="#"]',
      );
      if (!link) return;
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector<HTMLElement>(id);
      if (!target) return;
      event.preventDefault();
      if (!lenis) target.scrollIntoView();
      else if (link.dataset.autoplay !== undefined) autoplay(lenis, target);
      else lenis.scrollTo(target, { offset: 0 });
      history.replaceState(null, "", id);
    };
    document.addEventListener("click", onClick);

    // Any late layout change (fonts, lazy content) shifts every trigger below
    // it; re-measure once the page height settles so reveals fire on time.
    let lastHeight = document.body.scrollHeight;
    let refreshTimer = 0;
    const ro = new ResizeObserver(() => {
      const h = document.body.scrollHeight;
      if (Math.abs(h - lastHeight) < 2) return;
      lastHeight = h;
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    });
    ro.observe(document.body);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      ro.disconnect();
      window.clearTimeout(refreshTimer);
      document.removeEventListener("click", onClick);
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
    };
  }, []);

  return null;
}
