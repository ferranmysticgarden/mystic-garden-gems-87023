import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, staticFile, Img, random } from "remotion";
import { BigText } from "../components/BigText";
import { C } from "../theme";

const GoldRays: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `conic-gradient(from ${frame * 2}deg at 50% 55%, rgba(255,210,74,0.6) 0deg, transparent 20deg, rgba(255,61,154,0.5) 40deg, transparent 60deg, rgba(255,210,74,0.6) 80deg, transparent 100deg, rgba(168,255,96,0.4) 120deg, transparent 140deg)`,
        mixBlendMode: "screen",
      }}
    />
  );
};

const Confetti: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const colors = [C.gold, C.pink, C.lime, C.cyan, C.white, C.magenta];
  return (
    <>
      {new Array(120).fill(0).map((_, i) => {
        const seed = random(`c-${i}`);
        const startDelay = seed * 30;
        const t = frame - startDelay;
        if (t < 0) return null;
        const x = seed * width;
        const y = ((t * (5 + seed * 8)) % (height + 200)) - 100;
        const rot = t * (4 + seed * 8);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 16,
              height: 26,
              background: colors[i % colors.length],
              transform: `rotate(${rot}deg)`,
              boxShadow: `0 0 10px ${colors[i % colors.length]}`,
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

  const fairyIn = spring({ frame, fps, config: { damping: 8, stiffness: 100 } });
  const bob = Math.sin(frame / 10) * 20;
  const fairyScale = interpolate(fairyIn, [0, 1], [0.3, 1]);
  const fairyRot = Math.sin(frame / 14) * 4;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <GoldRays />
      <Confetti />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "55%",
          transform: `translate(-50%, calc(-50% + ${bob}px)) scale(${fairyScale}) rotate(${fairyRot}deg)`,
          filter: `drop-shadow(0 20px 60px rgba(255,210,74,0.8))`,
        }}
      >
        <Img src={staticFile("fairy_trophy.png")} style={{ width: 600, height: "auto" }} />
      </div>

      <div style={{ position: "absolute", top: 60, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <BigText delay={20} size={180} color={C.gold} stroke={C.magenta} pulse>
          ¡Descárgalo ya!
        </BigText>
      </div>
    </AbsoluteFill>
  );
};
