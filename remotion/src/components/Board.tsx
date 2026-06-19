import React from "react";
import { staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { C, FLOWERS } from "../theme";

interface Cell {
  kind: "flower" | "photo";
  value: string; // emoji or photo path
}

interface BoardProps {
  cells: Cell[][];
  // Per-cell pop/explode triggers — frame index relative to scene start
  pops?: Record<string, number>;
  removed?: Set<string>;
  size?: number;
}

export const Tile: React.FC<{ cell: Cell; size: number; popAt?: number; removed?: boolean; index?: number }> = ({ cell, size, popAt, removed, index = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Idle bob
  const bob = Math.sin((frame + index * 3) / 12) * 1.5;

  // Pop animation
  let scale = 1;
  let opacity = 1;
  if (removed) {
    opacity = 0;
    scale = 1.8;
  } else if (popAt !== undefined && frame >= popAt) {
    const s = spring({ frame: frame - popAt, fps, config: { damping: 6, stiffness: 220 } });
    scale = 1 + s * 0.35;
    if (frame - popAt > 6) {
      const fade = interpolate(frame - popAt, [6, 12], [1, 0], { extrapolateRight: "clamp" });
      opacity = fade;
      scale = 1 + s * 0.35 + (1 - fade) * 0.8;
    }
  }

  const r = size * 0.18;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: cell.kind === "flower"
          ? `linear-gradient(160deg, rgba(255,255,255,0.95), rgba(255,235,200,0.9))`
          : C.white,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.62,
        boxShadow: `inset 0 -${size * 0.06}px 0 rgba(0,0,0,0.12), 0 ${size * 0.04}px 0 rgba(0,0,0,0.25)`,
        transform: `translateY(${bob}px) scale(${scale})`,
        opacity,
        overflow: "hidden",
        border: `${size * 0.03}px solid rgba(255,255,255,0.6)`,
      }}
    >
      {cell.kind === "flower" ? (
        cell.value
      ) : (
        <img
          src={staticFile(cell.value)}
          width={size}
          height={size}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: r * 0.85 }}
        />
      )}
    </div>
  );
};

export const Board: React.FC<BoardProps> = ({ cells, pops = {}, removed = new Set(), size = 130 }) => {
  const gap = 12;
  const rows = cells.length;
  const cols = cells[0].length;
  const w = cols * size + (cols - 1) * gap;
  const h = rows * size + (rows - 1) * gap;
  return (
    <div
      style={{
        width: w,
        height: h,
        padding: 24,
        borderRadius: 32,
        background: "linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.15))",
        border: `3px solid ${C.gold}`,
        boxShadow: `0 0 60px rgba(255,210,74,0.4), inset 0 0 30px rgba(0,0,0,0.4)`,
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${size}px)`,
        gridTemplateRows: `repeat(${rows}, ${size}px)`,
        gap,
      }}
    >
      {cells.flatMap((row, r) =>
        row.map((cell, c) => {
          const key = `${r}-${c}`;
          return (
            <div key={key} style={{ position: "relative" }}>
              <Tile cell={cell} size={size} popAt={pops[key]} removed={removed.has(key)} index={r * cols + c} />
            </div>
          );
        })
      )}
    </div>
  );
};

export const makeFlowerBoard = (rows = 5, cols = 5): Cell[][] => {
  const out: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({ kind: "flower", value: FLOWERS[(r * 7 + c * 3) % FLOWERS.length] });
    }
    out.push(row);
  }
  return out;
};

export const makePhotoBoard = (rows = 5, cols = 5, photos: string[]): Cell[][] => {
  const out: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({ kind: "photo", value: photos[(r * 5 + c * 2) % photos.length] });
    }
    out.push(row);
  }
  return out;
};
