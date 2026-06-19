import React from "react";
import { AbsoluteFill, Series, useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
import { loadFont } from "@remotion/google-fonts/Outfit";
import { C } from "./theme";
import { SceneHook } from "./scenes/SceneHook";
import { SceneReveal } from "./scenes/SceneReveal";
import { ScenePlay } from "./scenes/ScenePlay";
import { SceneMemories } from "./scenes/SceneMemories";
import { SceneCTA } from "./scenes/SceneCTA";
import { SceneLogo } from "./scenes/SceneLogo";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

// Mystic animated background — purple→magenta with shifting golden glow
const MysticBG: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const cx = 50 + Math.sin(frame / 60) * 18;
  const cy = 50 + Math.cos(frame / 70) * 14;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at ${cx}% ${cy}%, ${C.purpleLight} 0%, ${C.purple} 30%, ${C.purpleDeep} 70%, #050010 100%)`,
      }}
    >
      {/* secondary magenta glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${100 - cx}% ${100 - cy}%, rgba(192,38,211,0.35), transparent 50%)`,
          mixBlendMode: "screen",
        }}
      />
      {/* gold rays sweeping */}
      <AbsoluteFill
        style={{
          background: `conic-gradient(from ${(frame * 0.8) % 360}deg at 50% 50%, transparent 0deg, rgba(255,210,74,0.12) 30deg, transparent 60deg, transparent 180deg, rgba(255,61,154,0.10) 210deg, transparent 240deg, transparent 360deg)`,
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};

// Magical floating sparkles — gold, pink, cyan
const Sparkles: React.FC<{ count?: number }> = ({ count = 90 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const items = new Array(count).fill(0).map((_, i) => i);
  const colors = [C.gold, C.pink, C.cyan, C.white, C.lime];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {items.map((i) => {
        const seed = random(`sp-${i}`);
        const seed2 = random(`sp2-${i}`);
        const x = seed * width;
        const baseY = seed2 * height;
        const y = (baseY + frame * (1 + seed * 2)) % height;
        const size = 4 + seed * 12;
        const op = 0.4 + Math.sin((frame + i * 7) / 12) * 0.4;
        const color = colors[i % colors.length];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              background: color,
              opacity: Math.max(0, op),
              boxShadow: `0 0 ${size * 2}px ${color}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily, background: C.purpleDeep }}>
      <MysticBG />
      <Sparkles count={80} />
      <Series>
        <Series.Sequence durationInFrames={90}><SceneHook /></Series.Sequence>
        <Series.Sequence durationInFrames={120}><SceneReveal /></Series.Sequence>
        <Series.Sequence durationInFrames={240}><ScenePlay /></Series.Sequence>
        <Series.Sequence durationInFrames={210}><SceneMemories /></Series.Sequence>
        <Series.Sequence durationInFrames={150}><SceneCTA /></Series.Sequence>
        <Series.Sequence durationInFrames={90}><SceneLogo /></Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
