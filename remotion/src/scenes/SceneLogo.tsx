import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { C } from "../theme";

export const SceneLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 140 } });
  const scale = interpolate(s, [0, 1], [0.7, 1]);
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const s2 = spring({ frame: frame - 18, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(ellipse at center, ${C.purpleLight} 0%, ${C.purpleDeep} 100%)`,
      }}
    >
      <div style={{ transform: `scale(${scale})`, opacity, textAlign: "center" }}>
        <div
          style={{
            fontSize: 140,
            fontWeight: 900,
            color: C.gold,
            WebkitTextStroke: `5px ${C.purpleDeep}`,
            textShadow: `0 8px 0 ${C.purpleDeep}, 0 20px 40px rgba(0,0,0,0.7)`,
            letterSpacing: -3,
            lineHeight: 0.9,
            textTransform: "uppercase",
          }}
        >
          Mystic Garden
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: C.white,
            marginTop: 12,
            letterSpacing: 8,
          }}>
          MATCH-3 · PHOTOS
        </div>
      </div>
      <div
        style={{
          marginTop: 60,
          fontSize: 40,
          fontWeight: 700,
          color: C.cream,
          opacity: s2,
          transform: `translateY(${(1 - s2) * 20}px)`,
          letterSpacing: 4,
        }}
      >
        MÁGICO · PERSONAL · ÚNICO
      </div>
      <div
        style={{
          marginTop: 50,
          padding: "20px 40px",
          background: C.white,
          color: C.purpleDeep,
          borderRadius: 16,
          fontSize: 32,
          fontWeight: 800,
          opacity: s2,
          boxShadow: `0 12px 30px rgba(0,0,0,0.5)`,
        }}
      >
        ▶ Disponible en Google Play
      </div>
    </AbsoluteFill>
  );
};
