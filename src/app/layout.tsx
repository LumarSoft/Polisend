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
  style: "italic",
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

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.title, template: "%s | Polisend" },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "bot de WhatsApp para productores de seguros",
    "chatbot para productores de seguros",
    "software para productores asesores de seguros",
    "denuncia de siniestro por WhatsApp",
    "cotizador de seguros por WhatsApp",
    "WhatsApp para productoras de seguros",
    "productores asesores de seguros",
    "Triunfo Seguros",
    "Sancor Seguros",
  ],
  alternates: { canonical: "/" },
  authors: [{ name: SITE.company }],
  creator: SITE.company,
  publisher: SITE.company,
  category: "technology",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    locale: "es_AR",
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
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
