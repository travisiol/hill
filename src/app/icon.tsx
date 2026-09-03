import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** The mark: the tile in three tones, with the crown band drawn above it. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#eef0f2",
        }}
      >
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
          <path d="M12 4.6 20 9.2 12 13.8 4 9.2Z" fill="#d9dde2" />
          <path d="M4 9.2 12 13.8v5.6L4 14.8Z" fill="#a8b0b9" />
          <path d="M20 9.2 12 13.8v5.6l8-4.6Z" fill="#7f8891" />
          <path
            d="M12 2.1 22 7.9 12 13.7 2 7.9Z"
            stroke="#101317"
            strokeOpacity="0.4"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
