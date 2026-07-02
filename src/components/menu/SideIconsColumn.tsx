import { Crown, Flame, Target, Gift, ShoppingBag } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface SideIconsColumnProps {
  onBattlePass: () => void;
  onStreak: () => void;
  onMissions: () => void;
  onLootChest: () => void;
  onShop: () => void;
  streakCount: number;
  canClaimStreak: boolean;
  visible?: boolean;
}

const iconBtn =
  "w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-lg border-2 active:scale-95 transition-transform hover:scale-105 relative";

export const SideIconsColumn = ({
  onBattlePass,
  onStreak,
  onMissions,
  onLootChest,
  onShop,
  streakCount,
  canClaimStreak,
  visible = true,
}: SideIconsColumnProps) => {
  const { t } = useLanguage();
  if (!visible) return null;

  return (
    <div
      className="fixed right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3"
      style={{ pointerEvents: "none" }}
    >
      <button
        onClick={onBattlePass}
        aria-label={t("side_icons.battle_pass")}
        className={`${iconBtn} bg-gradient-to-br from-yellow-500 to-orange-600 border-yellow-300/60`}
        style={{ pointerEvents: "auto" }}
      >
        <Crown className="w-6 h-6 text-white" />
        <span className="text-[8px] font-bold text-white leading-none mt-0.5">
          {t("side_icons.pass")}
        </span>
      </button>

      <button
        onClick={onStreak}
        aria-label={t("side_icons.streak")}
        className={`${iconBtn} bg-gradient-to-br from-orange-500 to-red-600 border-orange-300/60`}
        style={{ pointerEvents: "auto" }}
      >
        <Flame className="w-6 h-6 text-white" />
        <span className="text-[8px] font-bold text-white leading-none mt-0.5">
          {streakCount > 0 ? `🔥${streakCount}` : t("side_icons.streak_short")}
        </span>
        {canClaimStreak && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border border-white animate-pulse" />
        )}
      </button>

      <button
        onClick={onMissions}
        aria-label={t("side_icons.missions")}
        className={`${iconBtn} bg-gradient-to-br from-blue-500 to-cyan-600 border-blue-300/60`}
        style={{ pointerEvents: "auto" }}
      >
        <Target className="w-6 h-6 text-white" />
        <span className="text-[8px] font-bold text-white leading-none mt-0.5">
          {t("side_icons.missions_short")}
        </span>
      </button>

      <button
        onClick={onLootChest}
        aria-label={t("side_icons.chests")}
        className={`${iconBtn} bg-gradient-to-br from-amber-500 to-yellow-600 border-amber-300/60`}
        style={{ pointerEvents: "auto" }}
      >
        <Gift className="w-6 h-6 text-white" />
        <span className="text-[8px] font-bold text-white leading-none mt-0.5">
          {t("side_icons.chests_short")}
        </span>
      </button>

      <button
        onClick={onShop}
        aria-label={t("side_icons.shop")}
        className={`${iconBtn} bg-gradient-to-br from-purple-500 to-pink-600 border-purple-300/60`}
        style={{ pointerEvents: "auto" }}
      >
        <ShoppingBag className="w-6 h-6 text-white" />
        <span className="text-[8px] font-bold text-white leading-none mt-0.5">
          {t("side_icons.shop_short")}
        </span>
      </button>
    </div>
  );
};
