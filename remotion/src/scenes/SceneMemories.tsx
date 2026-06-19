import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, staticFile } from "remotion";
import { Board, makePhotoBoard } from "../components/Board";
import { BigText } from "../components/BigText";
import { C, THEME_PHOTOS } from "../theme";

const themed = [
  { label: "Mascotas", photos: THEME_PHOTOS.pets, color: C.pink },
  { label: "Selfies", photos: THEME_PHOTOS.selfies, color: C.gold },
  { label: "Comida", photos: THEME_PHOTOS.food, color: C.lime },
  { label: "Viajes", photos: THEME_PHOTOS.travel, color: C.cyan },
  { label: "Fiesta", photos: THEME_PHOTOS.party, color: C.magenta },
];

const PER = 40; // frames per board

const ThemeBoard: React.FC<{ idx: number; activeFrom: number }> = ({ idx, activeFrom }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - activeFrom;
  if (local < 0 || local > PER + 8) return null;

  const inS = spring({ frame: local, fps, config: { damping: 12, stiffness: 180 } });
  const outS = local > PER - 8 ? interpolate(local, [PER - 8, PER + 4], [1, 0], { extrapolateRight: "clamp" }) : 1;
  const scale = interpolate(inS, [0, 1], [0.7, 1]) * (1 + (1 - outS) * 0.3);
  const opacity = inS * outS;
  const rot = interpolate(inS, [0, 1], [idx % 2 === 0 ? -8 : 8, 0]);

  const t = themed[idx];
  const cells = makePhotoBoard(4, 4, t.photos);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
        opacity,
      }}
    >
      <div
        style={{
          transform: `scale(${scale}) rotate(${rot}deg)`,
          filter: `drop-shadow(0 0 60px ${t.color}99)`,
        }}
      >
        <Board cells={cells} size={140} />
      </div>
      <div
        style={{
          fontSize: 70,
          fontWeight: 900,
          color: t.color,
          textShadow: `0 4px 0 ${C.purpleDeep}, 0 10px 30px rgba(0,0,0,0.7)`,
          textTransform: "uppercase",
          letterSpacing: 2,
          transform: `scale(${scale})`,
        }}
      >
        {t.label}
      </div>
    </div>
  );
};

export const SceneMemories: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {themed.map((_, i) => (
        <ThemeBoard key={i} idx={i} activeFrom={i * PER} />
      ))}

      <div style={{ position: "absolute", top: 50, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <BigText delay={0} size={90} color={C.white} stroke={C.purpleDeep} pulse>
          Tus recuerdos cobran vida
        </BigText>
      </div>
    </AbsoluteFill>
  );
};
