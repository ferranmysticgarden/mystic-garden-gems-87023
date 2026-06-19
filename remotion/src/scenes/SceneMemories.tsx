import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile } from "remotion";
import { BigText } from "../components/BigText";
import { C } from "../theme";

const PhotoCard: React.FC<{ src: string; label: string; delay: number; x: number; y: number; rot: number }> = ({ src, label, delay, x, y, rot }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 140 } });
  const opIn = interpolate(s, [0, 1], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${interpolate(s, [0, 1], [0.6, 1])})`,
        opacity: opIn,
        width: 360,
        background: C.white,
        padding: 16,
        paddingBottom: 60,
        borderRadius: 10,
        boxShadow: `0 30px 60px rgba(0,0,0,0.6)`,
      }}
    >
      <img src={staticFile(src)} width={328} height={328} style={{ width: "100%", height: 328, objectFit: "cover", borderRadius: 4, display: "block" }} />
      <div style={{ marginTop: 16, textAlign: "center", fontFamily: "cursive", fontSize: 26, color: C.purpleDeep, fontWeight: 700 }}>{label}</div>
    </div>
  );
};

export const SceneMemories: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <PhotoCard src="photos/family.jpg" label="Familia" delay={0} x={-560} y={120} rot={-9} />
      <PhotoCard src="photos/dog.jpg" label="Mi peque" delay={20} x={-180} y={180} rot={4} />
      <PhotoCard src="photos/beach.jpg" label="Verano" delay={40} x={220} y={150} rot={-3} />
      <PhotoCard src="photos/cake.jpg" label="Cumple" delay={60} x={580} y={210} rot={8} />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 50 }}>
        {frame >= 110 && (
          <BigText delay={110} size={130} color={C.gold}>
            Tus recuerdos.<br />Tu juego.
          </BigText>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
