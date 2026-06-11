import { useTileSkin } from '@/hooks/useTileSkin';
import { TILE_TYPES } from '@/constants/tileTypes';

/**
 * Tiny 4x4 mockup board shown inside offer modals to remind the player,
 * AT THE MOMENT OF PURCHASE, that this game's unique feature is using
 * THEIR OWN photos as tiles.
 *
 * - If the user already uploaded any photo, the mockup uses those photos.
 * - Otherwise it falls back to 6 thematic emoji placeholders (face, pet,
 *   landscape, food, dessert, flower) so the message lands either way.
 *
 * Pure presentational — no interaction, no tracking.
 */

const PLACEHOLDER_EMOJIS = ['😀', '🐶', '🏞️', '🍕', '🍰', '🌸'] as const;

const PATTERN: number[] = [
  0, 1, 2, 3,
  4, 5, 0, 1,
  2, 3, 4, 5,
  1, 0, 5, 2,
];

interface PhotoTilesPreviewProps {
  caption?: string;
  className?: string;
}

export const PhotoTilesPreview = ({
  caption = '¡Personaliza tu juego con TUS fotos!',
  className = '',
}: PhotoTilesPreviewProps) => {
  const skins = useTileSkin();
  const hasUserPhotos = TILE_TYPES.some((t) => skins[t]);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-black/40 border border-yellow-400/30">
        {PATTERN.map((idx, i) => {
          const tile = TILE_TYPES[idx];
          const photo = skins[tile];
          return (
            <div
              key={i}
              className="w-10 h-10 rounded-md bg-gradient-to-br from-purple-900/60 to-pink-900/60 border border-yellow-400/40 flex items-center justify-center overflow-hidden"
            >
              {photo ? (
                <img
                  src={photo}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="text-2xl leading-none" aria-hidden>
                  {PLACEHOLDER_EMOJIS[idx]}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-yellow-300/90 font-semibold text-center">
        📸 {hasUserPhotos ? '¡Sigue personalizando!' : caption}
      </p>
    </div>
  );
};
