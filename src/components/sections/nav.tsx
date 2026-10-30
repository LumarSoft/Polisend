"use client";

import { useEffect, useRef } from "react";
import { Logo } from "@/components/brand/logo";
import { CtaButton } from "@/components/ui/primitives";
import { gsap, useGSAP } from "@/lib/gsap";

const LINKS = [
  { href: "#bot", label: "El bot" },
  { href: "#velocidad", label: "Velocidad" },
  { href: "#panel", label: "Panel" },
  { href: "#precio", label: "Precio" },
  { href: "#faq", label: "Preguntas" },
];

export function Nav() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.to(".nav-progress", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
      });
    },
    { scope: ref },
  );

  useEffect(() => {
    const onScroll = () => ref.current?.classList.toggle("is-scrolled", window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      ref={ref}
      className="group/nav fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500 [&.is-scrolled]:border-b [&.is-scrolled]:border-fg/6 [&.is-scrolled]:bg-canvas/75 [&.is-scrolled]:backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-5 sm:gap-6 sm:px-8 lg:h-[72px] lg:px-10">
        <a href="#inicio" aria-label="Polisend, volver al inicio" className="shrink-0 text-[20px] text-fg sm:text-[22px]">
          <Logo />
        </a>
        <nav aria-label="Secciones" className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-[14px] font-medium text-fg/65 transition-colors hover:bg-fg/6 hover:text-fg"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          {/* The panel lives in this same app, under /admin (its own root layout, so a full page load). */}
          <a
            href="/admin/login"
            className="inline-flex h-10 items-center rounded-full px-3 text-[13.5px] font-semibold whitespace-nowrap text-fg/80 transition-colors hover:bg-fg/6 hover:text-fg sm:border sm:border-fg/12 sm:px-4.5"
          >
            Iniciar sesión
          </a>
          <CtaButton size="sm">
            <span className="sm:hidden">Quiero</span>
            <span className="hidden sm:inline">Quiero Polisend</span>
          </CtaButton>
        </div>
      </div>
      <div className="nav-progress absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-brand" />
    </header>
  );
}
