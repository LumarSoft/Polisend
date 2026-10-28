import { FAQ } from "@/components/sections/faq";
import { FEATURES } from "@/lib/product";
import { SITE } from "@/lib/site";

/**
 * schema.org graph for the landing: who publishes it, what the product is,
 * what it costs and the FAQ. Only facts that the page itself states.
 */
export function JsonLd() {
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
        offers: {
          "@type": "Offer",
          url: `${SITE.url}/#precio`,
          price: SITE.priceUsd,
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: SITE.priceUsd,
            priceCurrency: "USD",
            unitText: `por mes, cada ${SITE.messagesPerPlan.toLocaleString("es-AR")} mensajes`,
            referenceQuantity: {
              "@type": "QuantitativeValue",
              value: SITE.messagesPerPlan,
              unitText: "mensajes",
            },
          },
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE.url}/#faq`,
        inLanguage: "es-AR",
        mainEntity: FAQ.map((f) => ({
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
