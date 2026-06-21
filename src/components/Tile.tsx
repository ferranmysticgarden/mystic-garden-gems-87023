import { memo, useCallback } from 'react';
import { useTileSkin } from '@/hooks/useTileSkin';
import { TILE_DEFAULT_EMOJIS, type TileType } from '@/constants/tileTypes';
import { useUserThemes } from '@/hooks/useUserThemes';
import { THEME_TILE_MAP } from '@/data/themes';

interface TileProps {
  tile: string;
  row: number;
  col: number;
  isSelected: boolean;
  isAnimating: boolean;
  isTarget: boolean;
  isHighlighted?: boolean;
  onTileClick: (row: number, col: number) => void;
}

export const Tile = memo(({ tile, row, col, isSelected, isAnimating, isTarget, isHighlighted, onTileClick }: TileProps) => {
  const skins = useTileSkin();
  const { activeTheme } = useUserThemes();
  const handleClick = useCallback(() => {
    onTileClick(row, col);
  }, [onTileClick, row, col]);

  const tileId = tile as TileType;
  const photo = skins[tileId] ?? null;
  const themeAsset = THEME_TILE_MAP[activeTheme]?.[tileId];
  const emoji = TILE_DEFAULT_EMOJIS[tileId];
  const showImage = typeof themeAsset === 'string' && themeAsset.startsWith('/');

  return (
    <button
      onClick={handleClick}
      className={`
        aspect-square rounded-lg flex items-center justify-center text-2xl sm:text-3xl
        transition-transform duration-100
        ${isSelected ? 'scale-110 ring-2 ring-accent' : ''}
        ${isAnimating ? 'animate-pop' : ''}
        ${isTarget ? 'ring-2 ring-secondary' : ''}
        ${isHighlighted ? 'ring-4 ring-yellow-300 animate-pulse z-10' : ''}
      `}
      style={{
        background: 'linear-gradient(180deg, hsl(270 40% 28% / 0.9), hsl(270 50% 18% / 0.95))',
        boxShadow: isHighlighted
          ? '0 0 24px rgba(253, 224, 71, 0.85), inset 0 1px 0 rgba(255,255,255,0.2)'
          : isSelected
          ? '0 0 15px rgba(255, 200, 50, 0.6), inset 0 1px 0 rgba(255,255,255,0.15)'
          : 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)',
        border: '1px solid rgba(147, 51, 234, 0.25)',
        willChange: 'transform',
        contain: 'layout style paint',
      }}
    >
      {photo ? (
        <img src={photo} alt="" loading="eager" draggable={false} className="w-[82%] h-[82%] object-cover rounded-full pointer-events-none" />
      ) : showImage ? (
        <img src={themeAsset} alt="" loading="eager" draggable={false} className="w-[82%] h-[82%] object-contain pointer-events-none" width={1024} height={1024} />
      ) : (
        <span>{themeAsset ?? emoji ?? tile}</span>
      )}
    </button>
  );
});
