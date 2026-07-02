import { useEffect, useMemo, useRef } from "react";
import { Lock, Star, Play } from "lucide-react";
import { LEVELS } from "@/data/levels";
import { useLanguage } from "@/hooks/useLanguage";
import { WorldBanner } from "@/components/menu/WorldBanner";
import { FairyLuna } from "@/components/menu/FairyLuna";

interface LevelMapProps {
  currentLevel: number;
  completedLevels: number[];
  onLevelClick: (levelId: number) => void;
}

const ROW_HEIGHT = 120;
const NODE_SIZE = 68;
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

export const LevelMap = ({
  currentLevel,
  completedLevels,
  onLevelClick,
}: LevelMapProps) => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentNodeRef = useRef<HTMLButtonElement | null>(null);

  const nodes = useMemo(() => computePositions(LEVELS.length), []);
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
      <div className="relative w-full" style={{ height: totalHeight }}>
        {/* Connecting path (SVG) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
          viewBox={`0 0 100 ${totalHeight}`}
        >
          <path
            d={nodes
              .map((n, i) => {
                const x = n.x * 100;
                const y = n.y;
                if (i === 0) return `M ${x} ${y}`;
                const prev = nodes[i - 1];
                const px = prev.x * 100;
                const py = prev.y;
                const midY = (py + y) / 2;
                return `C ${px} ${midY}, ${x} ${midY}, ${x} ${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="hsl(var(--muted-foreground) / 0.35)"
            strokeWidth="0.6"
            strokeDasharray="1.5 1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Nodes */}
        {nodes.map((n) => {
          const isCompleted = completedSet.has(n.id);
          const isCurrent = n.id === currentLevel;
          const isUnlocked = n.id <= currentLevel;
          const isLocked = !isUnlocked;

          return (
            <button
              key={n.id}
              ref={isCurrent ? currentNodeRef : undefined}
              onClick={() => !isLocked && onLevelClick(n.id)}
              disabled={isLocked}
              aria-label={`${t("game.level")} ${n.id}${
                isLocked ? " (bloqueado)" : ""
              }`}
              className={`absolute flex flex-col items-center justify-center rounded-full font-bold shadow-lg transition-transform active:scale-95 ${
                isCurrent
                  ? "bg-gradient-to-br from-yellow-400 to-orange-500 border-4 border-yellow-200 text-white animate-pulse hover:scale-110 z-10"
                  : isCompleted
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600 border-2 border-emerald-300 text-white hover:scale-105"
                    : isLocked
                      ? "bg-muted/60 border-2 border-muted-foreground/30 text-muted-foreground cursor-not-allowed"
                      : "bg-gradient-to-br from-primary to-primary/70 border-2 border-primary/50 text-primary-foreground hover:scale-105"
              }`}
              style={{
                width: NODE_SIZE,
                height: NODE_SIZE,
                left: `calc(${n.x * 100}% - ${NODE_SIZE / 2}px)`,
                top: n.y - NODE_SIZE / 2,
              }}
            >
              {isLocked ? (
                <Lock className="w-5 h-5" />
              ) : isCompleted ? (
                <>
                  <Star className="w-4 h-4 -mb-0.5 fill-yellow-200 text-yellow-200" />
                  <span className="text-base leading-none">{n.id}</span>
                </>
              ) : isCurrent ? (
                <>
                  <Play className="w-3.5 h-3.5 -mb-0.5 fill-white" />
                  <span className="text-lg leading-none">{n.id}</span>
                </>
              ) : (
                <span className="text-lg">{n.id}</span>
              )}

              {isCurrent && (
                <img
                  src="/celebration/fairy_trophy.png"
                  alt=""
                  className="absolute -top-8 -right-8 w-10 h-10 pointer-events-none animate-bounce"
                  loading="lazy"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
