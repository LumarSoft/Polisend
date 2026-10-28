import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { MARK_PATH } from "@/components/brand/logo";
import { SITE } from "@/lib/site";

export const alt = "Polisend — Tu WhatsApp atiende solo. Y sabe con quién habla.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fontsDir = join(process.cwd(), "node_modules/@fontsource");

// Read at module scope (like the Next docs example) so the image is prerendered at build time.
const [logo, bold, black] = await Promise.all([
  readFile(join(fontsDir, "bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff")),
  readFile(join(fontsDir, "inter-tight/files/inter-tight-latin-700-normal.woff")),
  readFile(join(fontsDir, "inter-tight/files/inter-tight-latin-800-normal.woff")),
]);

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "radial-gradient(circle at 85% 25%, #dfe7fd 0%, #f5f7fa 55%)",
          color: "#0b1526",
          fontFamily: "Inter Tight",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="44" height="54" viewBox="11 3 34 42">
            <path d={MARK_PATH} fill="#1f4fe0" fillRule="evenodd" />
          </svg>
          <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -2, fontFamily: "Bricolage" }}>polisend</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 112, fontWeight: 800, letterSpacing: -4, lineHeight: 0.95 }}>Tu WhatsApp</span>
          <span style={{ fontSize: 112, fontWeight: 800, letterSpacing: -4, lineHeight: 0.95 }}>
            atiende&nbsp;<span style={{ color: "#1f4fe0" }}>solo.</span>
          </span>
          <span style={{ marginTop: 18, fontSize: 36, fontWeight: 700, color: "#66728a", letterSpacing: -1 }}>
            Bot de WhatsApp + panel para productores de seguros
          </span>
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 26, fontWeight: 700 }}>
          {["Siniestros con fotos", "Cuotas", "Cotizador", `USD ${SITE.priceUsd}/mes · ${SITE.messagesPerPlan.toLocaleString("es-AR")} mensajes`].map((t, i) => (
            <span
              key={t}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                background: i === 3 ? "#1f4fe0" : "#ffffff",
                color: i === 3 ? "#ffffff" : "#0b1526",
                border: i === 3 ? "none" : "1px solid #e4e9f0",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bricolage", data: logo, weight: 700, style: "normal" },
        { name: "Inter Tight", data: bold, weight: 700, style: "normal" },
        { name: "Inter Tight", data: black, weight: 800, style: "normal" },
      ],
    },
  );
}
