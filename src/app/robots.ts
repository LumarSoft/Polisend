import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Everything is public: search engines and AI crawlers alike may index it.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
