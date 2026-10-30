import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      lastModified: SITE.lastUpdated,
      changeFrequency: "monthly",
      priority: 1,
    },
    { url: `${SITE.url}/privacidad`, lastModified: SITE.lastUpdated, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/terminos`, lastModified: SITE.lastUpdated, changeFrequency: "yearly", priority: 0.3 },
  ];
}
