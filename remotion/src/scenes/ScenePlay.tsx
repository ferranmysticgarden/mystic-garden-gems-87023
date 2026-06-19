import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig, spring } from "remotion";
import { Board, makePhotoBoard } from "../components/Board";
import { Subtitle } from "../components/BigText";
import { PHOTOS, C } from "../theme";

const Confetti: React.FC<{ active: boolean; originFrame: number }> = ({ active, originFrame }) => {
  const frame = useCurrentFrame();
  if (!active) return null;
  const f = frame - originFrame;
  if (f < 0 || f > 40) return null;
  return (
    <>
      {Array.from({ length: 18 }).map((_, i) => {
        const angle = (i / 18) * Math.PI * 2;
        const dist = interpolate(f, [0, 30], [0, 220]);
        const op = interpolate(f, [0, 8, 30], [0, 1, 0]);
        const colors = [C.gold, C.pink, C.lime, C.white];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `calc(50% + ${Math.cos(angle) * dist}px)`,
              top: `calc(50% + ${Math.sin(angle) * dist}px)`,
              width: 18,
              height: 18,
              background: colors[i % colors.length],
              borderRadius: 4,
              opacity: op,
              transform: `rotate(${f * 12}deg)`,
              boxShadow: `0 0 12px currentColor`,
              color: colors[i % colors.length],
            }}
          />
        );
      })}
    </>
  );
};

export const ScenePlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const board = makePhotoBoard(5, 5, PHOTOS);

  // Choreograph 3 match-3 sequences
  // Match 1: row 1, cells 1-3 (pop at frame 30)
  // Match 2: column 3, cells 0-2 (pop at frame 110)
  // Match 3: row 3, cells 1-3 (pop at frame 180)
  const pops: Record<string, number> = {
    "1-0": 30, "1-1": 30, "1-2": 30,
    "0-4": 110, "1-4": 110, "2-4": 110,
    "3-1": 180, "3-2": 180, "3-3": 180,
  };

  // Slight board zoom/pan for "cinematic"
  const zoom = interpolate(frame, [0, 240], [1, 1.05]);
  const tilt = Math.sin(frame / 60) * 2;

  // Combo bursts
  const combo1 = frame >= 30 && frame < 80;
  const combo2 = frame >= 110 && frame < 160;
  const combo3 = frame >= 180 && frame < 230;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: `translate(-50%, -50%) scale(${zoom}) rotate(${tilt}deg)` }}>
        <Board cells={board} size={120} pops={pops} />
      </div>

      {/* Combo labels */}
      {[
        { active: combo1, start: 30, label: "¡COMBO!" },
        { active: combo2, start: 110, label: "¡SUPER!" },
        { active: combo3, start: 180, label: "¡MEGA!" },
      ].map((c, i) => {
        if (!c.active) return null;
        const f = frame - c.start;
        const s = spring({ frame: f, fps, config: { damping: 6, stiffness: 200 } });
        const op = interpolate(f, [0, 10, 40, 50], [0, 1, 1, 0], { extrapolateRight: "clamp" });
        const angle = i === 0 ? -8 : i === 1 ? 6 : -4;
        const x = i === 0 ? -350 : i === 1 ? 380 : -300;
        const y = i === 0 ? -200 : i === 1 ? 50 : 250;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: `translate(-50%, -50%) scale(${s}) rotate(${angle}deg)`,
              fontSize: 110,
              fontWeight: 900,
              color: C.gold,
              WebkitTextStroke: `5px ${C.purpleDeep}`,
              textShadow: `0 6px 0 ${C.purpleDeep}, 0 16px 30px rgba(0,0,0,0.6)`,
              opacity: op,
              letterSpacing: -2,
            }}
          >
            {c.label}
          </div>
        );
      })}

      <Confetti active={combo1} originFrame={30} />
      <Confetti active={combo2} originFrame={110} />
      <Confetti active={combo3} originFrame={180} />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 60 }}>
        <Subtitle delay={20}>Sube tus fotos. Personaliza el tablero.</Subtitle>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
