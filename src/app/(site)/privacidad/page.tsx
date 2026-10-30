import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { PRIVACY } from "@/lib/legal/privacy";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Qué datos trata Polisend, para qué, con quién los comparte y cómo pedir que se eliminen.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacidadPage() {
  return <LegalPage doc={PRIVACY} />;
}
