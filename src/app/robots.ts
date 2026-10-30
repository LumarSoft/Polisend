import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// The landing is public for search engines and AI crawlers alike; the panel (/admin) is not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
