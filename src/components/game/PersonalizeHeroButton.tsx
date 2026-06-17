import { useEffect, useState } from 'react';
import { Camera, Sparkles } from 'lucide-react';
import { trackEvent } from '@/lib/trackEvent';
import { useTileSkin } from '@/hooks/useTileSkin';
import { TILE_TYPES } from '@/constants/tileTypes';

interface PersonalizeHeroButtonProps {
  onClick: () => void;
}

const FLOWER_EMOJIS = ['🌸', '🌺', '🌻', '🌷'];
const PHOTO_PLACEHOLDERS = ['😀', '🐶', '🏞️', '🍰'];

/**
 * Hero CTA shown on the main menu — above "Niveles".
 * Goal: drive users to the photo-tiles customization feature
 * (today buried behind a small outline button).
 *
 * Visual: full-width, strong gradient, animated mini-preview
 * that alternates flower tiles -> photo placeholders every 2s.
 * Pulsing "¡NUEVO!" badge.
 *
 * If the user already uploaded any custom photo, we swap the
 * placeholders for their real photos (closes the loop visually).
 */
export const PersonalizeHeroButton = ({ onClick }: PersonalizeHeroButtonProps) => {
  const [showPhotos, setShowPhotos] = useState(false);
  const skins = useTileSkin();

  const userPhotos: (string | null)[] = TILE_TYPES.slice(0, 4).map((t) => skins[t] || null);
  const hasAnyPhoto = userPhotos.some(Boolean);

  useEffect(() => {
    const interval = setInterval(() => setShowPhotos((p) => !p), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    trackEvent('personalize_hero_shown', { has_any_photo: hasAnyPhoto });
  }, [hasAnyPhoto]);

  const handleClick = () => {
    trackEvent('personalize_hero_clicked', { has_any_photo: hasAnyPhoto });
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className="relative w-full mb-3 rounded-2xl p-3 overflow-hidden text-left
                 bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600
                 border-2 border-pink-300/70 shadow-lg shadow-pink-500/30
                 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
    >
      {/* NUEVO badge */}
      <div className="absolute -top-1 -right-1 z-10">
        <div className="bg-yellow-400 text-purple-900 text-[10px] font-extrabold px-2 py-0.5 rounded-bl-lg rounded-tr-xl shadow-md animate-pulse">
          ¡NUEVO!
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Mini-preview animado: 4 tiles que alternan flores ↔ fotos */}
        <div className="grid grid-cols-2 gap-1 shrink-0 p-1 rounded-lg bg-black/30 border border-pink-200/40">
          {[0, 1, 2, 3].map((i) => {
            const photo = userPhotos[i];
            const showPhoto = showPhotos;
            return (
              <div
                key={i}
                className="w-7 h-7 rounded-md flex items-center justify-center overflow-hidden
                           bg-gradient-to-br from-purple-800/70 to-pink-800/70
                           border border-yellow-300/40 transition-all duration-500"
                style={{ transform: showPhoto ? 'rotateY(0deg)' : 'rotateY(0deg)' }}
              >
                {showPhoto ? (
                  photo ? (
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base leading-none animate-fade-in" aria-hidden>
                      {PHOTO_PLACEHOLDERS[i]}
                    </span>
                  )
                ) : (
                  <span className="text-base leading-none animate-fade-in" aria-hidden>
                    {FLOWER_EMOJIS[i]}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-extrabold text-sm leading-tight flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
            🌟 Pon TUS fotos en el tablero
          </p>
          <p className="text-pink-100/90 text-[11px] leading-snug mt-0.5">
            {hasAnyPhoto
              ? 'Sigue personalizando tus fichas con tus recuerdos'
              : 'Convierte cada ficha en una foto tuya, de tu familia o mascotas'}
          </p>
        </div>

        <div className="shrink-0 bg-white/20 rounded-full p-1.5">
          <Camera className="w-4 h-4 text-white" />
        </div>
      </div>
    </button>
  );
};
