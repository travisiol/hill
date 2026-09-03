import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";
import { FEE_BPS, pct } from "@/lib/economics";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;

/*
 * The card is the object and the rule, nothing else. The tile is drawn at the
 * same angle as the model, with the hour ring flattened to an ellipse behind
 * it and one amber arc on it — the longest reign, which is the whole game in
 * one shape.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#eef0f2",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <path d="M12 4.6 20 9.2 12 13.8 4 9.2Z" fill="#d9dde2" />
            <path d="M4 9.2 12 13.8v5.6L4 14.8Z" fill="#a8b0b9" />
            <path d="M20 9.2 12 13.8v5.6l8-4.6Z" fill="#7f8891" />
          </svg>
          <span
            style={{
              fontSize: 20,
              letterSpacing: 5,
              color: "#101317",
            }}
          >
            {siteConfig.name}
          </span>
          <span style={{ fontSize: 20, letterSpacing: 5, color: "#5d646d" }}>
            {siteConfig.ticker}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div
              style={{
                fontSize: 82,
                lineHeight: 1,
                letterSpacing: -3,
                color: "#101317",
              }}
            >
              {siteConfig.tagline}
            </div>
            {/* One text child per node: the OG renderer refuses an element
                with several children unless its display is set explicitly,
                and a sentence interrupted by an expression is several. */}
            <div
              style={{
                marginTop: 26,
                fontSize: 26,
                lineHeight: 1.35,
                color: "#454c55",
                maxWidth: 620,
              }}
            >
              {`The longest reign of each hour takes 100% of that hour's fees. ${pct(FEE_BPS)} of volume, no protocol cut.`}
            </div>
          </div>

          {/* The tile on its ring, at the model's angle. */}
          <svg width="330" height="250" viewBox="0 0 330 250" fill="none">
            <ellipse cx="165" cy="168" rx="150" ry="58" stroke="#101317" strokeOpacity="0.12" />
            <ellipse cx="165" cy="168" rx="126" ry="49" stroke="#101317" strokeOpacity="0.12" />
            <path
              d="M165 110 A150 58 0 0 1 296 196 L272 183 A126 49 0 0 0 165 119 Z"
              fill="#e39a2a"
            />
            <path d="M165 60 L262 106 L165 152 L68 106 Z" fill="#d9dde2" />
            <path d="M68 106 L165 152 V196 L68 150 Z" fill="#a8b0b9" />
            <path d="M262 106 L165 152 V196 L262 150 Z" fill="#7f8891" />
            <path
              d="M165 54 L274 106 L165 158 L56 106 Z"
              stroke="#9a5a06"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    ),
    { ...size },
  );
}
