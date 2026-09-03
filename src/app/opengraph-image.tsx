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
            <path d="M12 13.4 20 16.8 12 20.2 4 16.8Z" fill="#d9dde2" />
            <path d="M4 16.8 12 20.2v2.5L4 19.3Z" fill="#a8b0b9" />
            <path d="M20 16.8 12 20.2v2.5l8-3.4Z" fill="#7f8891" />
            <path
              d="M11.1 15.3v-1.9M12.9 15.3v-1.9"
              stroke="#a8b0b9"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            <path d="M12 13.6v-2.2" stroke="#d9dde2" strokeWidth="2.2" strokeLinecap="round" />
            <path
              d="M11 12.4 9 9M13 12.4 15 9"
              stroke="#a8b0b9"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            <circle cx="12" cy="10" r="1.5" fill="#f4f6f8" />
            <path d="M8.4 8.8V5.4l1.9 1.5L12 4.6l1.7 2.3 1.9-1.5v3.4Z" fill="#9a5a06" />
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

          {/* The scene, at the model's angle: the hour ring with the winning
              arc on it, the block, and whoever is standing on top. */}
          <svg width="330" height="260" viewBox="0 0 330 260" fill="none">
            <ellipse cx="165" cy="186" rx="150" ry="56" stroke="#101317" strokeOpacity="0.14" />
            <ellipse cx="165" cy="186" rx="126" ry="47" stroke="#101317" strokeOpacity="0.14" />
            <path
              d="M165 130 A150 56 0 0 1 293 212 L269 200 A126 47 0 0 0 165 139 Z"
              fill="#e39a2a"
            />
            {/* crowd */}
            <path d="M64 196a11 11 0 0 1 22 0v18H64Z" fill="#c3c9d0" />
            <circle cx="75" cy="176" r="8" fill="#c3c9d0" />
            <path d="M244 196a11 11 0 0 1 22 0v18h-22Z" fill="#c3c9d0" />
            <circle cx="255" cy="176" r="8" fill="#c3c9d0" />
            {/* the block */}
            <path d="M165 82 262 128 165 174 68 128Z" fill="#d9dde2" />
            <path d="M68 128 165 174v46L68 174Z" fill="#a8b0b9" />
            <path d="M262 128 165 174v46l97-46Z" fill="#7f8891" />
            {/* the king */}
            <path d="M158 82v-16M172 82V66" stroke="#a8b0b9" strokeWidth="7" strokeLinecap="round" />
            <path d="M152 58 136 26M178 58l16-32" stroke="#a8b0b9" strokeWidth="7" strokeLinecap="round" />
            <path d="M165 62V36" stroke="#c8ced5" strokeWidth="15" strokeLinecap="round" />
            <circle cx="165" cy="30" r="11" fill="#e6eaee" />
            <path d="M133 24V2l16 12 16-18 16 18 16-12v22Z" fill="#e39a2a" />
          </svg>
        </div>
      </div>
    ),
    { ...size },
  );
}
