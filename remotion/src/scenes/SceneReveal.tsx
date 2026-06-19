import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Board, makeFlowerBoard, makePhotoBoard } from "../components/Board";
import { BigText } from "../components/BigText";
import { PHOTOS, C } from "../theme";

export const SceneReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flowerBoard = makeFlowerBoard(5, 5);
  const photoBoard = makePhotoBoard(5, 5, PHOTOS);

  // Flash transition at frame 30
  const flash = interpolate(frame, [28, 32, 40], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const showPhotos = frame >= 32;
  const shake = frame > 28 && frame < 50 ? Math.sin(frame * 2) * 6 : 0;
  const s = spring({ frame: frame - 32, fps, config: { damping: 8, stiffness: 160 } });
  const scale = showPhotos ? interpolate(s, [0, 1], [1.15, 1]) : 1;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: "42%", left: "50%", transform: `translate(-50%, -50%) translateX(${shake}px) scale(${scale * 0.85})` }}>
        <Board cells={showPhotos ? photoBoard : flowerBoard} size={110} />
      </div>
      <AbsoluteFill style={{ background: C.white, opacity: flash, pointerEvents: "none" }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 40 }}>
        {frame >= 40 && (
          <BigText delay={40} size={110} color={C.gold} stroke={C.purpleDeep}>
            No. Juega con tus fotos
          </BigText>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
