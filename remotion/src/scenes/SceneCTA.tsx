import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { BigText } from "../components/BigText";
import { C } from "../theme";

const GoldRays: React.FC = () => {
  const frame = useCurrentFrame();
  const rot = frame * 0.4;
  return (
    <div
      style={{
        position: "absolute",
        width: 2400,
        height: 2400,
        left: "50%",
        top: "50%",
        transform: `translate(-50%, -50%) rotate(${rot}deg)`,
        background: `conic-gradient(from 0deg, transparent 0deg, rgba(255,210,74,0.25) 12deg, transparent 24deg, transparent 36deg, rgba(255,210,74,0.25) 48deg, transparent 60deg, transparent 72deg, rgba(255,210,74,0.25) 84deg, transparent 96deg, transparent 108deg, rgba(255,210,74,0.25) 120deg, transparent 132deg, transparent 144deg, rgba(255,210,74,0.25) 156deg, transparent 168deg, transparent 180deg, rgba(255,210,74,0.25) 192deg, transparent 204deg, transparent 216deg, rgba(255,210,74,0.25) 228deg, transparent 240deg, transparent 252deg, rgba(255,210,74,0.25) 264deg, transparent 276deg, transparent 288deg, rgba(255,210,74,0.25) 300deg, transparent 312deg, transparent 324deg, rgba(255,210,74,0.25) 336deg, transparent 348deg)`,
      }}
    />
  );
};

const Confetti: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: 60 }).map((_, i) => {
        const seed = i * 53;
        const x = (seed * 17) % 1920;
        const startY = -50 - (seed % 400);
        const speed = 4 + ((seed % 5));
        const y = startY + frame * speed;
        const colors = [C.gold, C.pink, C.lime, C.white, C.goldDeep];
        const color = colors[i % colors.length];
        const rot = frame * (6 + (i % 6));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 16,
              height: 22,
              background: color,
              transform: `rotate(${rot}deg)`,
              boxShadow: `0 0 8px ${color}`,
            }}
          />
        );
      })}
    </>
  );
};

export const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fairyS = spring({ frame, fps, config: { damping: 8, stiffness: 100 } });
  const fairyScale = interpolate(fairyS, [0, 1], [0.3, 1]);
  const bob = Math.sin(frame / 14) * 14;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <GoldRays />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) translateY(${bob}px) scale(${fairyScale})`,
          filter: `drop-shadow(0 20px 40px rgba(0,0,0,0.6))`,
        }}
      >
        <Img src={staticFile("fairy.png")} style={{ width: 600, height: "auto" }} />
      </div>
      <Confetti />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 80 }}>
        {frame >= 30 && (
          <BigText delay={30} size={160} color={C.gold}>
            Descarga<br />gratis ya
          </BigText>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
