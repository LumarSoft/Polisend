import { LogoMark } from "@/components/brand/logo";

const ITEMS = [
  "Denuncias de siniestro con fotos",
  "Estado de cuenta y cuotas",
  "Tarjeta, certificado y cupón de pago",
  "Cotización de auto y moto en tiempo real",
  "Auxilio y grúa",
  "Derivación a un asesor",
  "Atención fuera de horario",
  "Solicitudes de 8 ramos",
];

export function Marquee() {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden} className="flex shrink-0 items-center">
      {ITEMS.map((item) => (
        <li key={item} className="flex items-center">
          <span className="px-7 whitespace-nowrap">{item}</span>
          <LogoMark className="h-[0.8em] w-auto opacity-80" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="relative z-10 -my-2 overflow-hidden py-10">
      <div className="-rotate-[2deg] bg-brand py-4 text-on-brand shadow-[0_20px_60px_-20px_rgb(31_79_224/0.5)]">
        <div className="flex w-max animate-marquee font-display text-[clamp(1.25rem,2.4vw,2rem)] font-semibold tracking-[-0.03em]">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </div>
  );
}
