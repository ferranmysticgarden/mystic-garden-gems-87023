import { useEffect, useMemo, useRef } from "react";
import { Lock, Play, Star } from "lucide-react";
import { LEVELS } from "@/data/levels";
import { useLanguage } from "@/hooks/useLanguage";
import { WorldBanner } from "@/components/menu/WorldBanner";
import { FairyLuna } from "@/components/menu/FairyLuna";

interface LevelMapProps {
  currentLevel: number;
  completedLevels: number[];
  starsEarned?: Record<number, number>;
  onLevelClick: (levelId: number) => void;
}

const ROW_HEIGHT = 120;
const UNLOCKED_NODE_SIZE = 72;
const LOCKED_NODE_SIZE = 64;
const COLS = 3; // 3 nodes per row → serpentine

interface NodePos {
  id: number;
  x: number; // 0..1 (fraction of usable width)
  y: number; // absolute px from top
  row: number;
}

function computePositions(count: number): NodePos[] {
  const nodes: NodePos[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / COLS);
    const posInRow = i % COLS;
    // alternate direction per row (serpentine)
    const isReverse = row % 2 === 1;
    const col = isReverse ? COLS - 1 - posInRow : posInRow;
    // horizontal fraction: 0.15 / 0.5 / 0.85
    const x = 0.15 + (col / (COLS - 1)) * 0.7;
    const y = row * ROW_HEIGHT + 60;
    nodes.push({ id: i + 1, x, y, row });
  }
  return nodes;
}

const decorations = [
  { icon: "🍄", x: 31, y: 88, size: 24, rotate: -12 },
  { icon: "🦋", x: 70, y: 150, size: 22, rotate: 10 },
  { icon: "🌸", x: 13, y: 245, size: 20, rotate: -8 },
  { icon: "🌼", x: 82, y: 325, size: 22, rotate: 9 },
  { icon: "🍄", x: 47, y: 430, size: 20, rotate: 12 },
  { icon: "🦋", x: 17, y: 545, size: 24, rotate: -14 },
  { icon: "🌺", x: 76, y: 665, size: 21, rotate: 8 },
  { icon: "🌿", x: 52, y: 790, size: 24, rotate: -18 },
  { icon: "🌸", x: 28, y: 925, size: 20, rotate: 6 },
  { icon: "🦋", x: 86, y: 1045, size: 22, rotate: 16 },
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
  const totalHeight = nodes[nodes.length - 1].y + 120;

  // Auto-center current level on mount
  useEffect(() => {
    const t = setTimeout(() => {
      currentNodeRef.current?.scrollIntoView({
        block: "center",
        behavior: "auto",
      });
    }, 100);
    return () => clearTimeout(t);
  }, [currentLevel]);

  const completedSet = new Set(completedLevels);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-y-auto"
      style={{ maxHeight: "calc(100vh - 140px)" }}
    >
      <div className="sticky top-0 z-20">
        <WorldBanner currentLevel={currentLevel} />
      </div>
      <div className="relative w-full" style={{ height: totalHeight }}>
        {/* Connecting path (SVG) */}
        <svg
          className="absolute inset-0 z-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
          viewBox={`0 0 100 ${totalHeight}`}
          aria-hidden="true"
        >
          <path
            d={curvePath}
            fill="none"
            stroke="hsl(var(--foreground) / 0.36)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={curvePath}
            fill="none"
            stroke="hsl(45 92% 60%)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Forest decorations */}
        <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden" aria-hidden="true">
          {decorations.map((decoration, index) => (
            <span
              key={`${decoration.icon}-${index}`}
              className="absolute select-none opacity-80"
              style={{
                left: `${decoration.x}%`,
                top: decoration.y,
                fontSize: decoration.size,
                transform: `translate(-50%, -50%) rotate(${decoration.rotate}deg)`,
              }}
            >
              {decoration.icon}
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
          const earnedStarCount = isCompleted ? Math.max(1, Math.min(3, starsEarned[n.id] ?? 3)) : 0;

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
              {isCompleted && (
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
                aria-label={`${t("game.level")} ${n.id}${
                  isLocked ? " (bloqueado)" : ""
                }`}
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
                <span
                  className="absolute left-[15%] top-[12%] h-[28%] w-[38%] rounded-full bg-primary-foreground/45"
                  aria-hidden="true"
                />
                <span
                  className="absolute inset-x-[18%] bottom-[8%] h-[18%] rounded-full bg-foreground/12"
                  aria-hidden="true"
                />

                {isLocked ? (
                  <Lock className="relative z-10 h-5 w-5" />
                ) : isCurrent ? (
                  <span className="relative z-10 flex flex-col items-center leading-none">
                    <Play className="mb-0.5 h-4 w-4 fill-current" />
                    <span className="text-xl">{n.id}</span>
                  </span>
                ) : (
                  <span className="relative z-10 text-xl leading-none">{n.id}</span>
                )}

              {isCurrent && (
                <div className="absolute -top-16 -right-12 z-20 pointer-events-none animate-bounce">
                  <FairyLuna variant="pointing" size={56} />
                </div>
              )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
