import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Video to Text - AI-powered video transcription and frame analysis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* Glow */}
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)",
            top: -100,
            left: -50,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)",
            bottom: -100,
            right: -50,
          }}
        />

        {/* Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 88,
            height: 88,
            borderRadius: 22,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            marginBottom: 32,
            boxShadow: "0 0 40px rgba(99,102,241,0.3)",
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "28px solid white",
              borderTop: "18px solid transparent",
              borderBottom: "18px solid transparent",
              marginLeft: 6,
            }}
          />
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            display: "flex",
            gap: 12,
          }}
        >
          <span style={{ color: "white" }}>Video</span>
          <span
            style={{
              background: "linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            2Text
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: "rgba(161,161,170,1)",
            marginTop: 16,
            maxWidth: 600,
            textAlign: "center",
          }}
        >
          AI-powered video transcription & frame analysis
        </div>

        {/* Tags */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 40,
          }}
        >
          {["Speech to Text", "Frame Analysis", "Free AI"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "8px 20px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                color: "rgba(200,200,220,1)",
                fontSize: 16,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
