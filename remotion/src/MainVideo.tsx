import React from "react";
import { AbsoluteFill, Series, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/Outfit";
import { C } from "./theme";
import { SceneHook } from "./scenes/SceneHook";
import { SceneReveal } from "./scenes/SceneReveal";
import { ScenePlay } from "./scenes/ScenePlay";
import { SceneMemories } from "./scenes/SceneMemories";
import { SceneCTA } from "./scenes/SceneCTA";
import { SceneLogo } from "./scenes/SceneLogo";

loadFont("normal", { weights: ["400", "700", "800", "900"], subsets: ["latin"] });

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / durationInFrames;
  const hue = interpolate(t, [0, 1], [0, 30]);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at ${30 + Math.sin(frame / 60) * 20}% ${40 + Math.cos(frame / 80) * 20}%, ${C.purpleLight} 0%, ${C.purple} 35%, ${C.purpleDeep} 100%)`,
        filter: `hue-rotate(${hue}deg)`,
      }}
    >
      {/* Floating sparkles */}
      {Array.from({ length: 30 }).map((_, i) => {
        const seed = i * 37.7;
        const x = (seed * 13) % 100;
        const y = ((seed * 7) + frame * 0.3) % 110;
        const size = 3 + ((i * 11) % 6);
        const op = 0.3 + 0.5 * Math.abs(Math.sin((frame + i * 9) / 20));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              background: i % 3 === 0 ? C.gold : i % 3 === 1 ? C.pink : C.white,
              opacity: op,
              boxShadow: `0 0 ${size * 3}px currentColor`,
              color: i % 3 === 0 ? C.gold : i % 3 === 1 ? C.pink : C.white,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: "Outfit, sans-serif", overflow: "hidden" }}>
      <Background />
      <Series>
        <Series.Sequence durationInFrames={90}><SceneHook /></Series.Sequence>
        <Series.Sequence durationInFrames={120}><SceneReveal /></Series.Sequence>
        <Series.Sequence durationInFrames={240}><ScenePlay /></Series.Sequence>
        <Series.Sequence durationInFrames={210}><SceneMemories /></Series.Sequence>
        <Series.Sequence durationInFrames={180}><SceneCTA /></Series.Sequence>
        <Series.Sequence durationInFrames={60}><SceneLogo /></Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
