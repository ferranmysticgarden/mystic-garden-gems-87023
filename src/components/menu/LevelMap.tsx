import { useEffect, useMemo, useRef } from "react";
import { Lock, Play, Star } from "lucide-react";
import { LEVELS } from "@/data/levels";
import { useLanguage } from "@/hooks/useLanguage";
import { WorldBanner } from "@/components/menu/WorldBanner";
import { FairyLuna } from "@/components/menu/FairyLuna";
import { getWorldForLevel } from "@/data/worlds";

interface LevelMapProps {
  currentLevel: number;
  completedLevels: number[];
  starsEarned?: Record<number, number>;
  onLevelClick: (levelId: number) => void;
}

const ROW_HEIGHT = 120;
const UNLOCKED_NODE_SIZE = 76;
const LOCKED_NODE_SIZE = 66;
const COLS = 3;

interface NodePos {
  id: number;
  x: number;
  y: number;
  row: number;
}

function computePositions(count: number): NodePos[] {
  const nodes: NodePos[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / COLS);
    const posInRow = i % COLS;
    const isReverse = row % 2 === 1;
    const col = isReverse ? COLS - 1 - posInRow : posInRow;
    const x = 0.15 + (col / (COLS - 1)) * 0.7;
    const y = row * ROW_HEIGHT + 60;
    nodes.push({ id: i + 1, x, y, row });
  }
  return nodes;
}

// 20+ decorations distributed vertically — Pixar-style forest
const decorations = [
  { icon: "🍄", x: 8, y: 90, size: 26, rotate: -12 },
  { icon: "🦋", x: 72, y: 140, size: 24, rotate: 10 },
  { icon: "🌸", x: 92, y: 210, size: 22, rotate: -8 },
  { icon: "🌼", x: 6, y: 280, size: 24, rotate: 9 },
  { icon: "✨", x: 48, y: 330, size: 20, rotate: 0 },
  { icon: "🍄", x: 90, y: 380, size: 22, rotate: 14 },
  { icon: "🦋", x: 10, y: 460, size: 26, rotate: -14 },
  { icon: "🌺", x: 84, y: 520, size: 23, rotate: 8 },
  { icon: "🌿", x: 50, y: 590, size: 26, rotate: -18 },
  { icon: "🌸", x: 6, y: 660, size: 22, rotate: 6 },
  { icon: "🦋", x: 88, y: 720, size: 24, rotate: 16 },
  { icon: "✨", x: 46, y: 790, size: 18, rotate: 0 },
  { icon: "🍄", x: 10, y: 860, size: 26, rotate: -10 },
  { icon: "🌼", x: 90, y: 930, size: 22, rotate: 12 },
  { icon: "🦋", x: 8, y: 1000, size: 24, rotate: -14 },
  { icon: "🌺", x: 88, y: 1070, size: 23, rotate: 10 },
  { icon: "🌿", x: 48, y: 1140, size: 26, rotate: -20 },
  { icon: "🌸", x: 6, y: 1220, size: 22, rotate: 8 },
  { icon: "✨", x: 92, y: 1290, size: 20, rotate: 0 },
  { icon: "🍄", x: 46, y: 1360, size: 24, rotate: 12 },
];

const buildCurvePath = (nodes: NodePos[]) =>
  nodes
    .map((n, i) => {
      const x = n.x * 100;
      const y = n.y;
      if (i === 0) return `M ${x} ${y}`;
      const prev = nodes[i - 1];
      const px = prev.x * 100;
      const py = prev.y;
      const verticalGap = y - py;
      const curveLift = Math.max(34, verticalGap * 0.44);
      const sideSwing = x > px ? 10 : -10;
      return `C ${px + sideSwing} ${py + curveLift}, ${x - sideSwing} ${y - curveLift}, ${x} ${y}`;
    })
    .join(" ");

// Per-world background tint (subtle wash behind the map)
const WORLD_TINTS: Record<number, string> = {
  1: "radial-gradient(ellipse at 50% 0%, hsl(320 60% 40% / 0.28) 0%, hsl(280 55% 25% / 0.18) 40%, transparent 80%)",
  2: "radial-gradient(ellipse at 50% 0%, hsl(150 55% 35% / 0.32) 0%, hsl(160 45% 22% / 0.22) 45%, transparent 85%)",
  3: "radial-gradient(ellipse at 50% 0%, hsl(220 70% 45% / 0.30) 0%, hsl(240 55% 28% / 0.20) 45%, transparent 85%)",
  4: "radial-gradient(ellipse at 50% 0%, hsl(38 85% 50% / 0.30) 0%, hsl(28 70% 30% / 0.20) 45%, transparent 85%)",
};

const getNodeVisual = (state: "completed" | "current" | "locked" | "unlocked") => {
  if (state === "completed") {
    return {
      background:
        "radial-gradient(circle at 32% 24%, hsl(var(--primary-foreground) / 0.98) 0 9%, hsl(45 98% 68%) 16%, hsl(38 96% 52%) 54%, hsl(28 92% 38%) 100%)",
      borderColor: "hsl(32 88% 32%)",
      color: "hsl(32 80% 16%)",
    };
  }
  if (state === "current") {
    return {
      background:
        "radial-gradient(circle at 32% 24%, hsl(var(--primary-foreground) / 0.98) 0 8%, hsl(320 94% 76%) 18%, hsl(292 78% 55%) 55%, hsl(270 76% 38%) 100%)",
      borderColor: "hsl(286 72% 34%)",
      color: "hsl(var(--primary-foreground))",
    };
  }
  if (state === "locked") {
    return {
      background:
        "radial-gradient(circle at 35% 25%, hsl(var(--muted-foreground) / 0.62) 0 9%, hsl(var(--muted) / 0.92) 35%, hsl(var(--muted-foreground) / 0.42) 100%)",
      borderColor: "hsl(var(--muted-foreground) / 0.48)",
      color: "hsl(var(--muted-foreground))",
    };
  }
  return {
    background:
      "radial-gradient(circle at 32% 24%, hsl(var(--primary-foreground) / 0.95) 0 8%, hsl(var(--primary) / 0.9) 28%, hsl(var(--primary) / 0.66) 70%, hsl(var(--primary) / 0.42) 100%)",
    borderColor: "hsl(var(--primary) / 0.7)",
    color: "hsl(var(--primary-foreground))",
  };
};

export const LevelMap = ({
  currentLevel,
  completedLevels,
  starsEarned = {},
  onLevelClick,
}: LevelMapProps) => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentNodeRef = useRef<HTMLButtonElement | null>(null);

  const nodes = useMemo(() => computePositions(LEVELS.length), []);
  const curvePath = useMemo(() => buildCurvePath(nodes), [nodes]);
  const totalHeight = nodes[nodes.length - 1].y + 140;

  useEffect(() => {
    const t = setTimeout(() => {
      currentNodeRef.current?.scrollIntoView({ block: "center", behavior: "auto" });
    }, 100);
    return () => clearTimeout(t);
  }, [currentLevel]);

  const completedSet = new Set(completedLevels);
  const world = getWorldForLevel(currentLevel);
  const worldTint = WORLD_TINTS[world.id] ?? WORLD_TINTS[1];

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-y-auto overflow-x-hidden"
      style={{ maxHeight: "calc(100vh - 140px)" }}
    >
      <div className="sticky top-0 z-20">
        <WorldBanner currentLevel={currentLevel} />
      </div>
      <div
        className="relative w-full transition-[background] duration-700 ease-out"
        style={{ height: totalHeight, background: worldTint }}
      >
        {/* Connecting path (SVG) */}
        <svg
          className="absolute inset-0 z-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
          viewBox={`0 0 100 ${totalHeight}`}
          aria-hidden="true"
        >
          <path d={curvePath} fill="none" stroke="hsl(var(--foreground) / 0.36)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <path d={curvePath} fill="none" stroke="hsl(45 92% 60%)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* Forest decorations */}
        <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden" aria-hidden="true">
          {decorations.map((d, index) => (
            <span
              key={`${d.icon}-${index}`}
              className="absolute select-none opacity-85 animate-float-butterfly"
              style={{
                left: `${d.x}%`,
                top: d.y,
                fontSize: d.size,
                transform: `translate(-50%, -50%) rotate(${d.rotate}deg)`,
                animationDuration: `${6 + (index % 5)}s`,
                animationDelay: `${(index % 4) * 0.6}s`,
              }}
            >
              {d.icon}
            </span>
          ))}
        </div>

        {/* Nodes */}
        {nodes.map((n) => {
          const isCompleted = completedSet.has(n.id);
          const isCurrent = n.id === currentLevel;
          const isUnlocked = n.id <= currentLevel;
          const isLocked = !isUnlocked;
          const nodeState = isCompleted ? "completed" : isCurrent ? "current" : isLocked ? "locked" : "unlocked";
          const nodeSize = isLocked ? LOCKED_NODE_SIZE : UNLOCKED_NODE_SIZE;
          const nodeVisual = getNodeVisual(nodeState);
          const rawStars = starsEarned[n.id];
          const hasRealStars = typeof rawStars === "number" && rawStars > 0;
          const earnedStarCount = hasRealStars ? Math.min(3, rawStars as number) : 0;
          // BUG 1 FIX: strictly only completed non-current non-locked nodes with real stars
          const showStars = isCompleted && !isCurrent && !isLocked && earnedStarCount > 0;

          return (
            <div
              key={n.id}
              className="absolute z-10 flex items-center justify-center"
              style={{
                width: UNLOCKED_NODE_SIZE,
                height: UNLOCKED_NODE_SIZE + 30,
                left: `calc(${n.x * 100}% - ${UNLOCKED_NODE_SIZE / 2}px)`,
                top: n.y - UNLOCKED_NODE_SIZE / 2 - 24,
              }}
            >
              {showStars && (
                <div className="absolute top-0 left-1/2 flex -translate-x-1/2 items-end gap-0.5 pointer-events-none" aria-hidden="true">
                  {[1, 2, 3].map((starIndex) => {
                    const starObtained = starIndex <= earnedStarCount;
                    return (
                      <Star
                        key={starIndex}
                        className={starObtained ? "h-5 w-5 text-amber-300 fill-amber-300" : "h-3.5 w-3.5 text-muted-foreground/55 fill-muted/80"}
                        strokeWidth={starObtained ? 2.4 : 1.8}
                      />
                    );
                  })}
                </div>
              )}

              <div
                className="absolute rounded-full opacity-30"
                style={{
                  width: nodeSize * 0.82,
                  height: nodeSize * 0.18,
                  left: `calc(50% - ${(nodeSize * 0.82) / 2}px)`,
                  top: 28 + nodeSize * 0.84,
                  background: "hsl(var(--foreground) / 0.42)",
                  transform: "scaleX(1.12)",
                }}
                aria-hidden="true"
              />

              <button
                ref={isCurrent ? currentNodeRef : undefined}
                onClick={() => !isLocked && onLevelClick(n.id)}
                disabled={isLocked}
                aria-label={`${t("game.level")} ${n.id}${isLocked ? " (bloqueado)" : ""}`}
                className={`relative mt-[26px] flex items-center justify-center overflow-hidden rounded-full border-[4px] font-bold transition-transform active:scale-95 ${
                  isCurrent ? "animate-pulse hover:scale-110" : isLocked ? "cursor-not-allowed" : "hover:scale-105"
                }`}
                style={{
                  width: nodeSize,
                  height: nodeSize,
                  background: nodeVisual.background,
                  borderColor: nodeVisual.borderColor,
                  color: nodeVisual.color,
                }}
              >
                <span className="absolute left-[15%] top-[12%] h-[28%] w-[38%] rounded-full bg-primary-foreground/45" aria-hidden="true" />
                <span className="absolute inset-x-[18%] bottom-[8%] h-[18%] rounded-full bg-foreground/12" aria-hidden="true" />

                {/* BUG 2 FIX: números grandes, blancos, con text-shadow para contraste */}
                {isLocked ? (
                  <Lock className="relative z-10 h-6 w-6" strokeWidth={2.6} />
                ) : isCurrent ? (
                  <span className="relative z-10 flex flex-col items-center leading-none">
                    <Play className="mb-0.5 h-4 w-4 fill-current" />
                    <span
                      className="text-2xl md:text-3xl font-black text-white"
                      style={{ textShadow: "0 2px 4px rgba(0,0,0,0.75), 0 0 6px rgba(0,0,0,0.5)" }}
                    >
                      {n.id}
                    </span>
                  </span>
                ) : (
                  <span
                    className="relative z-10 text-2xl md:text-3xl font-black leading-none text-white"
                    style={{ textShadow: "0 2px 4px rgba(0,0,0,0.75), 0 0 6px rgba(0,0,0,0.5)" }}
                  >
                    {n.id}
                  </span>
                )}
              </button>
            </div>
          );
        })}

        {/* BUG 3 FIX: Luna posicionada absolutamente sobre el mapa (no dentro del botón),
            96px, glow radial dorado, animación float, z-30 por encima de todo. */}
        {nodes.map((n) => {
          if (n.id !== currentLevel) return null;
          const lunaSize = 96;
          const glowSize = lunaSize * 1.5;
          // Colocar a la derecha del nodo actual, ligeramente arriba, sin desbordar
          const rawLeftPct = n.x * 100 + 8; // 8% a la derecha del centro del nodo
          const leftPct = Math.min(rawLeftPct, 78); // evita salir del contenedor
          return (
            <div
              key={`luna-${n.id}`}
              className="absolute z-30 pointer-events-none animate-luna-float"
              style={{
                left: `calc(${leftPct}% - ${lunaSize / 2}px)`,
                top: n.y - lunaSize - 8,
                width: lunaSize,
                height: lunaSize,
              }}
              aria-hidden="true"
            >
              <div
                className="absolute rounded-full blur-2xl"
                style={{
                  width: glowSize,
                  height: glowSize,
                  left: (lunaSize - glowSize) / 2,
                  top: (lunaSize - glowSize) / 2,
                  background:
                    "radial-gradient(circle, hsl(45 100% 65% / 0.95) 0%, hsl(45 100% 55% / 0.55) 40%, transparent 75%)",
                }}
              />
              <FairyLuna
                variant="pointing"
                size={lunaSize}
                className="relative drop-shadow-[0_4px_10px_rgba(0,0,0,0.55)]"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
