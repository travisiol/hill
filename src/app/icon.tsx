import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** The mark: a figure on the block, both arms up, crown above. */
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
        <svg width="54" height="54" viewBox="0 0 24 24" fill="none">
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
      </div>
    ),
    { ...size },
  );
}
