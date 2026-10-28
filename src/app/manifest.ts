import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Polisend · Bot de WhatsApp para productores de seguros",
    short_name: SITE.name,
    description: SITE.description,
    lang: "es-AR",
    start_url: "/",
    display: "browser",
    background_color: "#f5f7fa",
    theme_color: "#1f4fe0",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
