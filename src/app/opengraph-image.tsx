import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactNode } from "react";
import { ImageResponse } from "next/og";
import { MARK_PATH } from "@/components/brand/logo";
import { SITE } from "@/lib/site";

export const alt =
  "Polisend: bot de WhatsApp con IA para productores de seguros. Denuncias de siniestro con fotos, cuotas, documentación y cotizaciones 24/7.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fontsDir = join(process.cwd(), "node_modules/@fontsource");

// Read at module scope (like the Next docs example) so the image is prerendered at build time.
const [logo, medium, bold, black] = await Promise.all([
  readFile(join(fontsDir, "bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff")),
  readFile(join(fontsDir, "inter-tight/files/inter-tight-latin-500-normal.woff")),
  readFile(join(fontsDir, "inter-tight/files/inter-tight-latin-700-normal.woff")),
  readFile(join(fontsDir, "inter-tight/files/inter-tight-latin-800-normal.woff")),
]);

const BLUE = "#1f4fe0";
const NAVY = "#0b1526";
const MUTE = "#56617a";

const FEATURES = [
  "Denuncias de siniestro con fotos",
  "Cuotas, pólizas y documentación",
  "Cotización al instante · Triunfo y Sancor",
];

function Bubble({ out, children }: { out?: boolean; children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignSelf: out ? "flex-end" : "flex-start",
        maxWidth: 230,
        padding: "9px 13px",
        borderRadius: 16,
        borderTopRightRadius: out ? 5 : 16,
        borderTopLeftRadius: out ? 16 : 5,
        background: out ? BLUE : "#ffffff",
        color: out ? "#ffffff" : NAVY,
        fontSize: 16,
        fontWeight: 500,
        lineHeight: 1.3,
        boxShadow: out ? "none" : "0 1px 2px rgba(11,21,38,0.08)",
      }}
    >
      {children}
    </div>
  );
}

export default function Image() {
  const messages = SITE.messagesPerPlan.toLocaleString("es-AR");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "radial-gradient(circle at 82% 30%, #dbe5fd 0%, #f5f7fa 58%)",
          color: NAVY,
          fontFamily: "Inter Tight",
        }}
      >
        {/* left: what it is, what it does, what it costs */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 720,
            padding: "56px 0 56px 68px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg width="38" height="47" viewBox="11 3 34 42">
              <path d={MARK_PATH} fill={BLUE} fillRule="evenodd" />
            </svg>
            <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1.8, fontFamily: "Bricolage" }}>
              polisend
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: BLUE, letterSpacing: -0.5 }}>
              Bot de WhatsApp para productores de seguros
            </span>
            <span style={{ marginTop: 14, fontSize: 92, fontWeight: 800, letterSpacing: -3.5, lineHeight: 0.95 }}>
              Tu WhatsApp
            </span>
            <span style={{ display: "flex", fontSize: 92, fontWeight: 800, letterSpacing: -3.5, lineHeight: 0.95 }}>
              atiende&nbsp;<span style={{ color: BLUE }}>solo.</span>
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 30 }}>
              {FEATURES.map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 25, fontWeight: 500, color: "#2a3448" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      background: BLUE,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24">
                      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  {f}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, fontSize: 21, fontWeight: 700, whiteSpace: "nowrap" }}>
            <span style={{ padding: "11px 20px", borderRadius: 999, background: BLUE, color: "#ffffff" }}>
              {`USD ${SITE.priceUsd}/mes · ${messages} mensajes`}
            </span>
            <span style={{ padding: "11px 20px", borderRadius: 999, background: "#ffffff", border: "1px solid #dfe5ee" }}>
              Atiende 24/7
            </span>
          </div>
        </div>

        {/* right: the product, as the visitor will see it */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            right: 92,
            top: 58,
            width: 320,
            height: 640,
            padding: 10,
            borderRadius: 52,
            background: "#0f1412",
            boxShadow: "0 40px 80px -20px rgba(11,21,38,0.35)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              borderRadius: 43,
              overflow: "hidden",
              background: "#e8edf4",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "34px 16px 12px",
                background: "#ffffff",
                borderBottom: "1px solid #e4e9f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  background: BLUE,
                }}
              >
                <svg width="17" height="21" viewBox="11 3 34 42">
                  <path d={MARK_PATH} fill="#ffffff" fillRule="evenodd" />
                </svg>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 17, fontWeight: 700 }}>Tu Productora</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: MUTE }}>en línea</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, padding: "18px 14px" }}>
              <Bubble out>Hola, me acaban de chocar</Bubble>
              <Bubble>¡Hola! Soy Sofía. Pasame tu DNI o la patente y te busco.</Bubble>
              <Bubble out>AB123CD</Bubble>
              <div
                style={{
                  display: "flex",
                  alignSelf: "center",
                  padding: "5px 12px",
                  borderRadius: 999,
                  background: "#dbe5fd",
                  color: BLUE,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Cliente identificado · Lucía G.
              </div>
              <Bubble>Contame qué pasó y mandame las fotos del daño.</Bubble>
              <Bubble>Denuncia registrada, con las 4 fotos.</Bubble>
            </div>
          </div>
        </div>

        {/* panel notification overlapping the phone */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            right: 40,
            bottom: 30,
            width: 270,
            padding: "14px 18px",
            borderRadius: 18,
            background: NAVY,
            color: "#ffffff",
            boxShadow: "0 24px 50px -16px rgba(11,21,38,0.45)",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500, color: "#a9b4c8" }}>Panel · Novedades</span>
          <span style={{ marginTop: 4, fontSize: 19, fontWeight: 700 }}>Nuevo siniestro · Lucía G.</span>
          <span style={{ fontSize: 15, fontWeight: 500, color: "#c7cfdc" }}>Peugeot 208 · 4 adjuntos</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bricolage", data: logo, weight: 700, style: "normal" },
        { name: "Inter Tight", data: medium, weight: 500, style: "normal" },
        { name: "Inter Tight", data: bold, weight: 700, style: "normal" },
        { name: "Inter Tight", data: black, weight: 800, style: "normal" },
      ],
    },
  );
}
