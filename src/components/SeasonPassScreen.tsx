import { ArrowLeft, Lock, Check, Trophy, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSeasonPass } from "@/hooks/useSeasonPass";
import { usePayment } from "@/hooks/usePayment";
import { useState } from "react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/trackEvent";
import type { TierReward } from "@/data/seasonPassTiers";

const formatReward = (r: TierReward): string => {
  const parts: string[] = [];
  if (r.gems) parts.push(`${r.gems}💎`);
  if (r.lives) parts.push(`${r.lives}❤️`);
  if (r.powerups) parts.push(`${r.powerups}⚡`);
  return parts.join(" + ") || "—";
};

interface SeasonPassScreenProps {
  onBack: () => void;
}

export const SeasonPassScreen = ({ onBack }: SeasonPassScreenProps) => {
  const { user } = useAuth();
  const {
    progressPoints,
    isPremium,
    claimedTiers,
    tiers,
    claimTier,
    unlockPremium,
  } = useSeasonPass(user?.id ?? null);
  const { createPayment, loading } = usePayment();
  const processing = loading;
  const [claimingTier, setClaimingTier] = useState<number | null>(null);

  const handleClaim = async (tierId: number) => {
    setClaimingTier(tierId);
    const result = await claimTier(tierId);
    setClaimingTier(null);
    if (result.success) {
      trackEvent("season_tier_claimed", { tierId, premium: isPremium });
      // Anti-avalanche: mark the session engagement slot so the global
      // achievement modal (unlocked by season progress) doesn't stack
      // on top of this claim confirmation.
      try { sessionStorage.setItem('engagement_popup_shown_session', 'true'); } catch { /* ignore */ }
      toast.success(`¡Recompensa reclamada! ${formatReward(result.reward ?? {})}`);
    } else {
      toast.error(result.error ?? "No se pudo reclamar");
    }
  };

  const handleUnlockPremium = async () => {
    try {
      trackEvent("season_pass_premium_purchase_start", {});
      const ok = await createPayment("season_pass_premium", "season_pass_screen");
      if (ok) {
        await unlockPremium();
        toast.success("¡Pase Premium activado!");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  const maxPoints = tiers[tiers.length - 1].requiredPoints;
  const progressPct = Math.min(100, (progressPoints / maxPoints) * 100);

  return (
    <div className="min-h-screen p-4 bg-gradient-to-b from-purple-950 via-indigo-950 to-black">
      <div className="max-w-md mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-3 text-white">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>

        <div className="rounded-2xl bg-gradient-to-r from-purple-800 to-indigo-800 p-5 border-2 border-purple-400 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-7 h-7 text-yellow-300" />
            <h1 className="text-2xl font-bold text-white">Pase de Temporada</h1>
          </div>
          <p className="text-purple-200 text-sm mb-3">
            Progresa, reclama recompensas. {isPremium ? "✨ PREMIUM activo" : "Desbloquea Premium para 5x más recompensas."}
          </p>
          <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-purple-300 mt-1">{progressPoints} / {maxPoints} puntos</p>

          {!isPremium && (
            <Button
              onClick={handleUnlockPremium}
              disabled={processing}
              className="w-full mt-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold"
            >
              <Crown className="w-4 h-4 mr-2" />
              {processing ? "Procesando..." : "Desbloquear PREMIUM 4,99€"}
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {tiers.map((tier) => {
            const unlocked = progressPoints >= tier.requiredPoints;
            const claimed = claimedTiers.includes(tier.id);
            const reward = isPremium ? tier.premiumReward : tier.freeReward;

            return (
              <div
                key={tier.id}
                className={`rounded-xl p-3 border ${
                  claimed
                    ? "bg-green-900/30 border-green-500/40"
                    : unlocked
                      ? "bg-purple-900/40 border-purple-400/60"
                      : "bg-gray-900/40 border-gray-700/40 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      claimed ? "bg-green-600 text-white" : unlocked ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-400"
                    }`}>
                      {claimed ? <Check className="w-5 h-5" /> : unlocked ? tier.id : <Lock className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Tier {tier.id}</p>
                      <p className="text-xs text-purple-300">
                        {tier.requiredPoints} pts • {formatReward(reward)}
                        {isPremium && <span className="ml-1 text-yellow-300">✨</span>}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={!unlocked || claimed || claimingTier === tier.id}
                    onClick={() => handleClaim(tier.id)}
                    variant={claimed ? "ghost" : "default"}
                  >
                    {claimed ? "✓" : claimingTier === tier.id ? "..." : unlocked ? "Reclamar" : "Bloqueado"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
