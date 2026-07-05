import { getWorldForLevel } from '@/data/worlds';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { useLanguage } from '@/hooks/useLanguage';

interface Props {
  currentLevel: number;
}

export const WorldBanner = ({ currentLevel }: Props) => {
  const { t } = useLanguage();
  if (!FEATURE_FLAGS.worldBanners) return null;
  const world = getWorldForLevel(currentLevel);
  const range = `${world.from}-${world.to === 999 ? '∞' : world.to}`;
  return (
    <div
      className={`w-full py-2 px-4 bg-gradient-to-r ${world.gradient} text-white font-bold text-center shadow-md`}
      role="banner"
      aria-label={`${t('worlds.world_label')} ${world.name}`}
    >
      <span className="text-lg mr-2">{world.emoji}</span>
      <span className="tracking-wide">{world.name}</span>
      <span className="ml-2 text-xs opacity-80">
        {t('game.level')} {range}
      </span>
    </div>
  );
};
