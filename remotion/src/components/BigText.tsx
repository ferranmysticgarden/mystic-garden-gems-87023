import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C } from "../theme";

export const BigText: React.FC<{
  children: React.ReactNode;
  delay?: number;
  size?: number;
  color?: string;
  stroke?: string;
  pulse?: boolean;
  outDelay?: number;
}> = ({ children, delay = 0, size = 140, color = C.white, stroke = C.purpleDeep, pulse = false, outDelay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sIn = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 180 } });
  let scale = interpolate(sIn, [0, 1], [0.6, 1]);
  let opacity = interpolate(sIn, [0, 1], [0, 1]);
  if (pulse) {
    scale *= 1 + Math.sin(frame / 8) * 0.04;
  }
  if (outDelay !== undefined && frame > outDelay) {
    const o = interpolate(frame - outDelay, [0, 12], [1, 0], { extrapolateRight: "clamp" });
    opacity *= o;
    scale *= 1 + (1 - o) * 0.2;
  }
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: 900,
        color,
        letterSpacing: -2,
        lineHeight: 0.95,
        textAlign: "center",
        textTransform: "uppercase",
        WebkitTextStroke: `4px ${stroke}`,
        textShadow: `0 8px 0 ${stroke}, 0 12px 30px rgba(0,0,0,0.5)`,
        transform: `scale(${scale})`,
        opacity,
        padding: "0 60px",
      }}
    >
      {children}
    </div>
  );
};

export const Subtitle: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
  return (
    <div
      style={{
        fontSize: 52,
        fontWeight: 700,
        color: C.cream,
        textAlign: "center",
        opacity: s,
        transform: `translateY(${(1 - s) * 30}px)`,
        textShadow: `0 4px 12px rgba(0,0,0,0.6)`,
      }}
    >
      {children}
    </div>
  );
};
