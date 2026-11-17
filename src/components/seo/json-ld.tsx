import { faqFor } from "@/components/sections/faq";
import type { PlanCatalog } from "@/lib/plan-format";
import { FEATURES } from "@/lib/product";
import { SITE } from "@/lib/site";

/**
 * schema.org graph for the landing: who publishes it, what the product is and
 * the FAQ. Only facts that the page itself states, and never a price: the plans
 * are told in tokens (decision of 17/11).
 */
export function JsonLd({ catalog }: { catalog: PlanCatalog }) {
  const org = `${SITE.url}/#organization`;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": org,
        name: SITE.name,
        url: SITE.url,
        logo: `${SITE.url}/apple-icon`,
        description: SITE.description,
        areaServed: { "@type": "Country", name: "Argentina" },
        parentOrganization: {
          "@type": "Organization",
          name: SITE.company,
          address: {
            "@type": "PostalAddress",
            addressLocality: SITE.city,
            addressRegion: SITE.region,
            addressCountry: SITE.country,
          },
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          telephone: SITE.phoneDisplay,
          url: `https://wa.me/${SITE.whatsappNumber}`,
          areaServed: SITE.country,
          availableLanguage: "es",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        inLanguage: "es-AR",
        publisher: { "@id": org },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE.url}/#software`,
        name: SITE.name,
        url: SITE.url,
        description: SITE.description,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Bot de WhatsApp para productores de seguros",
        operatingSystem: "Web, WhatsApp",
        inLanguage: "es-AR",
        audience: { "@type": "BusinessAudience", audienceType: "Productores asesores de seguros" },
        areaServed: { "@type": "Country", name: "Argentina" },
        featureList: FEATURES,
        publisher: { "@id": org },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE.url}/#faq`,
        inLanguage: "es-AR",
        mainEntity: faqFor(catalog).map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }}
    />
  );
}
