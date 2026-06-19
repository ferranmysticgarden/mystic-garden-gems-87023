import React from "react";
import {
  AbsoluteFill,
  Sequence,
  Video,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/Bangers";
import { loadFont as loadBody } from "@remotion/google-fonts/Poppins";

const display = loadDisplay("normal", { weights: ["400"], subsets: ["latin"] });
const body = loadBody("normal", { weights: ["700", "900"], subsets: ["latin"] });

const CLIPS = [
  "https://id-preview--b7778f96-6661-4e96-a891-680abe7f31b6.lovable.app/__l5e/assets-v1/da2e2e68-223b-4cbf-90aa-bb6cc0027ebe/clip_01.mp4",
  "https://id-preview--b7778f96-6661-4e96-a891-680abe7f31b6.lovable.app/__l5e/assets-v1/9d01a367-fb59-4795-85ba-985f92f7a03a/clip_02.mp4",
  "https://id-preview--b7778f96-6661-4e96-a891-680abe7f31b6.lovable.app/__l5e/assets-v1/38f341c9-fbf9-4b3a-9a61-69230dc3883f/clip_03.mp4",
  "https://id-preview--b7778f96-6661-4e96-a891-680abe7f31b6.lovable.app/__l5e/assets-v1/90adf269-fe2b-4642-a3f3-1a3f67424f97/clip_04.mp4",
  "https://id-preview--b7778f96-6661-4e96-a891-680abe7f31b6.lovable.app/__l5e/assets-v1/18892856-684f-4003-a2c8-4fae2fc74a70/clip_05.mp4",
  "https://id-preview--b7778f96-6661-4e96-a891-680abe7f31b6.lovable.app/__l5e/assets-v1/677c8d04-ac76-47f2-a968-df753fbcd3af/clip_06.mp4",
];

const SCENE = 150; // 5s @ 30fps
const TOTAL = SCENE * 6;

// White flash transition between scenes
const Flash: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [at - 3, at, at + 6], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (opacity <= 0) return null;
  return (
    <AbsoluteFill
      style={{ background: "white", opacity, mixBlendMode: "screen" }}
    />
  );
};

// Vignette + color grade overlay to unify clips
const Grade: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(20,0,40,0.55) 100%)",
      mixBlendMode: "multiply",
    }}
  />
);

// Kinetic text with punch-in spring + shake + glow
const KineticText: React.FC<{
  text: string;
  accent?: string;
  size?: number;
  yPercent?: number;
  delay?: number;
  highlight?: string;
}> = ({ text, accent = "#FFD93D", size = 140, yPercent = 78, delay = 6, highlight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - delay;
  const s = spring({ frame: f, fps, config: { damping: 10, stiffness: 180, mass: 0.6 } });
  const scale = interpolate(s, [0, 1], [0.4, 1]);
  const opacity = interpolate(f, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // micro shake after entry
  const shakeT = Math.max(0, f - 10);
  const shakeX = Math.sin(shakeT * 0.9) * Math.max(0, 4 - shakeT * 0.15);
  const shakeY = Math.cos(shakeT * 1.1) * Math.max(0, 3 - shakeT * 0.15);

  const parts = highlight
    ? text.split(highlight).flatMap((p, i, arr) =>
        i < arr.length - 1 ? [p, highlight] : [p]
      )
    : [text];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-start",
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: `${yPercent}%`,
          transform: `translate(${shakeX}px, ${shakeY}px) scale(${scale})`,
          opacity,
          fontFamily: body.fontFamily,
          fontWeight: 900,
          fontSize: size,
          lineHeight: 1,
          color: "white",
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          textAlign: "center",
          textShadow:
            "0 0 30px rgba(255,180,40,0.9), 0 0 60px rgba(255,80,200,0.6), 0 8px 0 rgba(0,0,0,0.55), 0 14px 30px rgba(0,0,0,0.7)",
          WebkitTextStroke: "3px rgba(0,0,0,0.85)",
          paintOrder: "stroke fill",
        }}
      >
        {parts.map((p, i) =>
          p === highlight ? (
            <span key={i} style={{ color: accent }}>
              {p}
            </span>
          ) : (
            <span key={i}>{p}</span>
          )
        )}
      </div>
    </AbsoluteFill>
  );
};

// Subtle zoom-in on each clip for cinematic feel
const ClipScene: React.FC<{ src: string; direction?: "in" | "out" | "panL" | "panR" }> = ({
  src,
  direction = "in",
}) => {
  const frame = useCurrentFrame();
  const t = frame / SCENE;
  let scale = 1;
  let x = 0;
  if (direction === "in") scale = interpolate(t, [0, 1], [1.05, 1.18]);
  if (direction === "out") scale = interpolate(t, [0, 1], [1.2, 1.04]);
  if (direction === "panL") {
    scale = 1.15;
    x = interpolate(t, [0, 1], [40, -40]);
  }
  if (direction === "panR") {
    scale = 1.15;
    x = interpolate(t, [0, 1], [-40, 40]);
  }
  return (
    <AbsoluteFill>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `translateX(${x}px) scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <Video
          src={src}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </AbsoluteFill>
  );
};

// Final logo lockup
const LogoLockup: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 20, fps, config: { damping: 9, stiffness: 140 } });
  const scale = interpolate(s, [0, 1], [0.6, 1]);
  const op = interpolate(frame, [20, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ctaPulse = 1 + Math.sin(frame * 0.25) * 0.04;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", pointerEvents: "none" }}>
      <div
        style={{
          transform: `scale(${scale})`,
          opacity: op,
          textAlign: "center",
          background: "rgba(0,0,0,0.35)",
          padding: "40px 80px",
          borderRadius: 40,
          border: "3px solid rgba(255,215,80,0.8)",
          boxShadow: "0 0 80px rgba(255,180,40,0.6), inset 0 0 40px rgba(255,180,40,0.2)",
        }}
      >
        <div
          style={{
            fontFamily: display.fontFamily,
            fontSize: 180,
            lineHeight: 0.95,
            color: "white",
            letterSpacing: "0.02em",
            textShadow: "0 0 40px rgba(255,180,40,1), 0 6px 0 rgba(120,20,80,0.9)",
          }}
        >
          MYSTIC GARDEN
        </div>
        <div
          style={{
            fontFamily: body.fontFamily,
            fontWeight: 900,
            fontSize: 56,
            color: "#FFD93D",
            marginTop: 14,
            letterSpacing: "0.15em",
            textShadow: "0 0 20px rgba(255,180,40,0.8)",
          }}
        >
          MATCH-3 · PHOTOS
        </div>
      </div>
      <div
        style={{
          marginTop: 40,
          transform: `scale(${ctaPulse})`,
          fontFamily: body.fontFamily,
          fontWeight: 900,
          fontSize: 80,
          color: "white",
          background: "linear-gradient(90deg,#E91E63,#FF9800)",
          padding: "24px 60px",
          borderRadius: 30,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          boxShadow: "0 10px 40px rgba(233,30,99,0.6)",
          opacity: op,
        }}
      >
        Gratis en Google Play
      </div>
    </AbsoluteFill>
  );
};

export const MainVideoV3: React.FC<{ vertical?: boolean }> = ({ vertical = false }) => {
  // Scale text down for 9:16 since canvas is narrower
  const k = vertical ? 0.62 : 1;
  return (
    <AbsoluteFill style={{ background: "black" }}>
      {/* Scene 1: Hook — fairy among mushrooms */}
      <Sequence from={0} durationInFrames={SCENE}>
        <ClipScene src={CLIPS[0]} direction="in" />
        <Grade />
        <KineticText text="ENTRA AL JARDÍN MÁGICO" accent="#FFD93D" highlight="MÁGICO" size={130 * k} yPercent={vertical ? 70 : 75} delay={8} />
      </Sequence>

      {/* Scene 2: Forest flythrough */}
      <Sequence from={SCENE} durationInFrames={SCENE}>
        <ClipScene src={CLIPS[1]} direction="panR" />
        <Grade />
        <KineticText text="UN MUNDO QUE COBRA VIDA" accent="#7CFFB2" highlight="VIDA" size={120 * k} yPercent={vertical ? 72 : 78} delay={10} />
      </Sequence>

      {/* Scene 3: Board explosion */}
      <Sequence from={SCENE * 2} durationInFrames={SCENE}>
        <ClipScene src={CLIPS[2]} direction="in" />
        <Grade />
        <KineticText text="COMBINA · EXPLOTA · GANA" accent="#FFD93D" highlight="GANA" size={120 * k} yPercent={vertical ? 72 : 78} delay={6} />
      </Sequence>

      {/* Scene 4: Photos transform — THE USP */}
      <Sequence from={SCENE * 3} durationInFrames={SCENE}>
        <ClipScene src={CLIPS[3]} direction="out" />
        <Grade />
        <KineticText text="CON TUS FOTOS" accent="#FF4FB7" highlight="TUS FOTOS" size={170 * k} yPercent={vertical ? 10 : 12} delay={6} />
        <KineticText text="EN CADA PARTIDA" accent="#FFD93D" size={100 * k} yPercent={vertical ? 80 : 82} delay={20} />
      </Sequence>

      {/* Scene 5: Combo explosion */}
      <Sequence from={SCENE * 4} durationInFrames={SCENE}>
        <ClipScene src={CLIPS[4]} direction="in" />
        <Grade />
        <KineticText text="CIENTOS DE NIVELES" accent="#FFD93D" highlight="NIVELES" size={130 * k} yPercent={vertical ? 72 : 76} delay={6} />
      </Sequence>

      {/* Scene 6: Castle finale + CTA */}
      <Sequence from={SCENE * 5} durationInFrames={SCENE}>
        <ClipScene src={CLIPS[5]} direction="in" />
        <Grade />
        <LogoLockup vertical={vertical} />
      </Sequence>

      {/* White flashes between cuts for energy */}
      <Flash at={SCENE} />
      <Flash at={SCENE * 2} />
      <Flash at={SCENE * 3} />
      <Flash at={SCENE * 4} />
      <Flash at={SCENE * 5} />
    </AbsoluteFill>
  );
};

export const MainVideoV3Vertical: React.FC = () => <MainVideoV3 vertical />;

export const V3_DURATION = TOTAL;
