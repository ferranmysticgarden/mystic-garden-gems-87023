import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Board, makeFlowerBoard } from "../components/Board";
import { BigText } from "../components/BigText";
import { C } from "../theme";

export const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const board = makeFlowerBoard(5, 5);

  const boardIn = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const boardScale = interpolate(boardIn, [0, 1], [0.6, 1]);
  const boardY = interpolate(boardIn, [0, 1], [80, 0]);
  const tilt = Math.sin(frame / 20) * 3;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, calc(-50% + ${boardY}px)) scale(${boardScale}) rotate(${tilt}deg)`,
          filter: `drop-shadow(0 20px 60px rgba(255,210,74,0.4))`,
        }}
      >
        <Board cells={board} size={110} />
      </div>

      <div
        style={{
          position: "absolute",
          top: 90,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <BigText delay={10} pulse size={130} color={C.gold} stroke={C.purpleDeep}>
          ¿Otro match-3…?
        </BigText>
      </div>
    </AbsoluteFill>
  );
};
