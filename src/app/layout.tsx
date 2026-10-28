import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Geist_Mono,
  Inter,
  Inter_Tight,
  Instrument_Serif,
} from "next/font/google";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { SITE } from "@/lib/site";
import "./globals.css";

// Only the logo wordmark uses Bricolage.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: "700",
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const description =
  "El bot de WhatsApp con IA y el panel para productores de seguros. Denuncias de siniestro con fotos, cuotas, documentación y cotizaciones al instante, las 24 horas. Integrado con Triunfo y Sancor.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Polisend — Tu WhatsApp atiende solo. Y sabe con quién habla.",
    template: "%s · Polisend",
  },
  description,
  applicationName: "Polisend",
  keywords: [
    "bot de WhatsApp para seguros",
    "productor de seguros",
    "productores asesores de seguros",
    "denuncia de siniestro por WhatsApp",
    "cotizador de seguros",
    "Triunfo Seguros",
    "Sancor Seguros",
  ],
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Polisend",
    title: "Polisend — Tu WhatsApp atiende solo.",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Polisend — Tu WhatsApp atiende solo.",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f7fa",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${bricolage.variable} ${interTight.variable} ${instrument.variable} ${inter.variable} ${geistMono.variable} antialiased`}
    >
      <body>
        <noscript>
          <style>{`[data-reveal],[data-split],[data-hero]{visibility:visible!important;opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
