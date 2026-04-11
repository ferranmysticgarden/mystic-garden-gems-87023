import { memo, useCallback } from 'react';

interface TileProps {
  tile: string;
  row: number;
  col: number;
  isSelected: boolean;
  isAnimating: boolean;
  isTarget: boolean;
  onTileClick: (row: number, col: number) => void;
}

export const Tile = memo(({ tile, row, col, isSelected, isAnimating, isTarget, onTileClick }: TileProps) => {
  const handleClick = useCallback(() => {
    onTileClick(row, col);
  }, [onTileClick, row, col]);

  return (
    <button
      onClick={handleClick}
      className={`
        aspect-square rounded-lg flex items-center justify-center text-2xl sm:text-3xl
        transition-transform duration-100
        ${isSelected ? 'scale-110 ring-2 ring-accent' : ''}
        ${isAnimating ? 'animate-pop' : ''}
        ${isTarget ? 'ring-2 ring-secondary' : ''}
      `}
      style={{
        background: 'linear-gradient(180deg, hsl(270 40% 28% / 0.9), hsl(270 50% 18% / 0.95))',
        boxShadow: isSelected 
          ? '0 0 15px rgba(255, 200, 50, 0.6), inset 0 1px 0 rgba(255,255,255,0.15)'
          : 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)',
        border: '1px solid rgba(147, 51, 234, 0.25)',
        willChange: 'transform',
        contain: 'layout style paint',
      }}
    >
      <span>{tile}</span>
    </button>
  );
});