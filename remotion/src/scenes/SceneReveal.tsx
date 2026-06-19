import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, staticFile, random } from "remotion";
import { Board, makeFlowerBoard, makePhotoBoard } from "../components/Board";
import { BigText } from "../components/BigText";
import { C, PHOTOS } from "../theme";

// Massive gold explosion ring
const GoldExplosion: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 80 } });
  const scale = interpolate(s, [0, 1], [0, 4]);
  const op = interpolate(frame - at, [0, 8, 40], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 600,
        height: 600,
        transform: `translate(-50%, -50%) scale(${scale})`,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(255,210,74,0.9) 0%, rgba(255,61,154,0.6) 40%, transparent 70%)`,
        opacity: op,
        mixBlendMode: "screen",
      }}
    />
  );
};

export const SceneReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Transformation at frame 20
  const transformAt = 20;
  const transformed = frame >= transformAt;

  // Board cycles through different photo sets rapidly
  const photoCycleFrame = Math.floor((frame - transformAt) / 12);
  const photoOffset = Math.max(0, photoCycleFrame) * 3;
  const photos = PHOTOS.slice(photoOffset % PHOTOS.length).concat(PHOTOS).slice(0, PHOTOS.length);

  const cells = transformed ? makePhotoBoard(5, 5, photos) : makeFlowerBoard(5, 5);

  const tilt = Math.sin(frame / 14) * 4;
  const pulse = 1 + Math.sin(frame / 8) * 0.04;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) rotate(${tilt}deg) scale(${pulse})`,
          filter: `drop-shadow(0 0 80px rgba(255,210,74,0.6))`,
        }}
      >
        <Board cells={cells} size={110} />
      </div>

      <GoldExplosion at={transformAt - 6} />

      <div style={{ position: "absolute", top: 70, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <BigText delay={30} pulse size={140} color={C.gold} stroke={C.magenta}>
          …con TUS fotos
        </BigText>
      </div>
    </AbsoluteFill>
  );
};
