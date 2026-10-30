import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { TERMS } from "@/lib/legal/terms";

export const metadata: Metadata = {
  title: "Términos del servicio",
  description: "Las reglas del servicio entre Lumarsoft y cada productora que contrata Polisend.",
  alternates: { canonical: "/terminos" },
};

export default function TerminosPage() {
  return <LegalPage doc={TERMS} />;
}
