import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Board, makeFlowerBoard } from "../components/Board";
import { BigText } from "../components/BigText";

export const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const board = makeFlowerBoard(5, 5);
  const boardScale = interpolate(frame, [0, 30], [0.5, 0.95], { extrapolateRight: "clamp" });
  const boardRot = interpolate(frame, [0, 90], [-4, 0]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: `translate(-50%, -50%) scale(${boardScale}) rotate(${boardRot}deg)` }}>
        <Board cells={board} size={120} />
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ marginTop: -700 }}>
          <BigText delay={10} size={150} pulse>
            ¿Un match-3<br />más?
          </BigText>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
