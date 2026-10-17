import { ImageResponse } from "next/og";

// The image shown when a link to the site is shared. Night ground, the wordmark and one cyan line.
export const alt = "054repairs, iPhone-reparatie aan huis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px 88px",
        background: "#060c18",
        color: "#f4f8fd",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <svg width="36" height="48" viewBox="0 0 24 32">
          <rect
            x="1.5"
            y="1.5"
            width="21"
            height="29"
            rx="5"
            fill="none"
            stroke="#c9d6e8"
            strokeWidth="2"
          />
          <circle cx="12" cy="20" r="4" fill="#3ec5ff" />
          <path
            d="M12 8v7"
            stroke="#3ec5ff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <div style={{ fontSize: 44, letterSpacing: "-0.02em" }}>054repairs</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            width: 128,
            height: 10,
            borderRadius: 5,
            background: "#3ec5ff",
          }}
        />
        <div
          style={{
            marginTop: 40,
            fontSize: 80,
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
          }}
        >
          iPhone-reparatie aan huis
        </div>
        <div style={{ marginTop: 24, fontSize: 34, color: "#a3b4cc" }}>
          Wij rijden naar je toe en repareren op locatie.
        </div>
      </div>
    </div>,
    size,
  );
}
