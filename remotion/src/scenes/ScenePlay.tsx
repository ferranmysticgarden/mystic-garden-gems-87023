import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, random } from "remotion";
import { Board, makePhotoBoard } from "../components/Board";
import { BigText, Subtitle } from "../components/BigText";
import { C, PHOTOS, THEME_PHOTOS } from "../theme";

const Confetti: React.FC<{ originFrame: number; count?: number }> = ({ originFrame, count = 40 }) => {
  const frame = useCurrentFrame();
  const t = frame - originFrame;
  if (t < 0 || t > 50) return null;
  const colors = [C.gold, C.pink, C.lime, C.cyan, C.white];
  return (
    <>
      {new Array(count).fill(0).map((_, i) => {
        const seed = random(`cf-${originFrame}-${i}`);
        const angle = seed * Math.PI * 2;
        const speed = 6 + seed * 12;
        const x = Math.cos(angle) * speed * t;
        const y = Math.sin(angle) * speed * t + 0.5 * t * t;
        const rot = t * (5 + seed * 8);
        const op = interpolate(t, [0, 10, 45], [1, 1, 0], { extrapolateRight: "clamp" });
        return (
          <div
            key={`${originFrame}-${i}`}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 14,
              height: 22,
              background: colors[i % colors.length],
              transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`,
              opacity: op,
              boxShadow: `0 0 8px ${colors[i % colors.length]}`,
            }}
          />
        );
      })}
    </>
  );
};

const ComboBadge: React.FC<{ at: number; text: string; color: string }> = ({ at, text, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 6, stiffness: 200 } });
  if (frame < at || frame > at + 28) return null;
  const op = interpolate(frame - at, [0, 4, 22, 28], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  const rot = interpolate(s, [0, 1], [-15, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: `translate(-50%, -50%) scale(${0.5 + s * 0.9}) rotate(${rot}deg)`,
        opacity: op,
        fontSize: 200,
        fontWeight: 900,
        color,
        letterSpacing: -4,
        textShadow: `0 6px 0 ${C.purpleDeep}, 0 12px 0 ${C.purpleDeep}, 0 20px 40px rgba(0,0,0,0.7)`,
        WebkitTextStroke: `4px ${C.purpleDeep}`,
        pointerEvents: "none",
      }}
    >
      {text}
    </div>
  );
};

export const ScenePlay: React.FC = () => {
  const frame = useCurrentFrame();

  // Switch board theme every 60 frames (2s)
  const themes = [PHOTOS, THEME_PHOTOS.selfies.concat(THEME_PHOTOS.pets), THEME_PHOTOS.food.concat(THEME_PHOTOS.travel), THEME_PHOTOS.party.concat(THEME_PHOTOS.selfies)];
  const themeIdx = Math.floor(frame / 60) % themes.length;
  const photos = themes[themeIdx];
  const cells = makePhotoBoard(5, 5, photos);

  // Combo bursts at specific frames
  const combos = [
    { at: 30, text: "¡COMBO!", color: C.gold },
    { at: 90, text: "¡SUPER!", color: C.pink },
    { at: 150, text: "¡MEGA!", color: C.lime },
    { at: 210, text: "¡WOW!", color: C.cyan },
  ];

  // Pop random tiles to feel like gameplay
  const pops: Record<string, number> = {};
  combos.forEach((c) => {
    for (let i = 0; i < 5; i++) {
      const r = Math.floor(random(`p-${c.at}-${i}-r`) * 5);
      const col = Math.floor(random(`p-${c.at}-${i}-c`) * 5);
      pops[`${r}-${col}`] = c.at;
    }
  });

  // Board breathing + shake on combos
  const boardScale = 1 + Math.sin(frame / 18) * 0.02;
  const shake = combos.some((c) => frame >= c.at && frame < c.at + 8)
    ? Math.sin(frame * 3) * 8
    : 0;
  const tilt = Math.sin(frame / 25) * 3 + shake * 0.3;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "52%",
          transform: `translate(calc(-50% + ${shake}px), -50%) scale(${boardScale}) rotate(${tilt}deg)`,
          filter: `drop-shadow(0 0 60px rgba(255,210,74,0.5))`,
        }}
      >
        <Board cells={cells} pops={pops} size={120} />
      </div>

      {combos.map((c) => (
        <React.Fragment key={c.at}>
          <ComboBadge at={c.at} text={c.text} color={c.color} />
          <Confetti originFrame={c.at} />
        </React.Fragment>
      ))}

      <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Subtitle delay={10}>Sube cualquier foto · juega con tus recuerdos</Subtitle>
      </div>
    </AbsoluteFill>
  );
};
