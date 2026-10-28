import { ImageResponse } from "next/og";
import { MARK_PATH } from "@/components/brand/logo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1f4fe0",
        }}
      >
        <svg width="100" height="124" viewBox="11 3 34 42">
          <path d={MARK_PATH} fill="#ffffff" fillRule="evenodd" />
        </svg>
      </div>
    ),
    size,
  );
}
