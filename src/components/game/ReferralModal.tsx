import { useEffect, useState } from "react";
import { X, Copy, Share2, Gift, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useReferral } from "@/hooks/useReferral";
import { trackEvent } from "@/lib/trackEvent";
import { toast } from "sonner";

interface Props {
  onClose: () => void;
  onRedeemSuccess?: (gems: number) => void;
}

const SHARE_BASE_URL = "https://mysticgardenpro.com";

export const ReferralModal = ({ onClose, onRedeemSuccess }: Props) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { stats, loadOrCreateCode, redeemCode } = useReferral(user?.id ?? null);
  const [inputCode, setInputCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"invite" | "redeem">("invite");

  useEffect(() => {
    trackEvent("referral_screen_opened", {});
    if (user) loadOrCreateCode();
  }, [user, loadOrCreateCode]);

  const shareUrl = stats.code ? `${SHARE_BASE_URL}/?ref=${stats.code}` : "";
  const shareMessage = stats.code
    ? `${t("referral.share_message")} ${shareUrl}`
    : "";

  const handleCopy = async () => {
    if (!stats.code) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      trackEvent("referral_link_copied", { code: stats.code });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("referral.copy_fail"));
    }
  };

  const handleShare = async () => {
    if (!stats.code) return;
    trackEvent("referral_share_clicked", { code: stats.code });
    // Try Web Share API (Android WebView supports it)
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: t("referral.share_title"),
          text: shareMessage,
          url: shareUrl,
        });
        return;
      } catch { /* user cancelled or unsupported */ }
    }
    // Fallback: copy
    handleCopy();
    toast.success(t("referral.link_copied"));
  };

  const handleRedeem = async () => {
    if (!user) {
      toast.error(t("referral.login_required"));
      return;
    }
    const clean = inputCode.trim().toUpperCase();
    if (!/^MG-[A-Z0-9]{4,10}$/.test(clean)) {
      toast.error(t("referral.invalid_code"));
      return;
    }
    setRedeeming(true);
    const result = await redeemCode(clean);
    setRedeeming(false);
    if (result.ok) {
      toast.success(`🎁 +${result.gems} 💎 ${t("referral.gems_earned")}`);
      onRedeemSuccess?.(result.gems || 0);
      onClose();
    } else {
      const errMap: Record<string, string> = {
        already_redeemed: t("referral.err_already_redeemed"),
        invalid_code: t("referral.err_invalid"),
        self_referral: t("referral.err_self"),
      };
      toast.error(errMap[result.error || ""] || t("referral.err_generic"));
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-gradient-to-b from-emerald-900 via-teal-900 to-emerald-900 rounded-3xl p-6 max-w-sm w-full border-2 border-emerald-400/60 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label={t("common.close") || "Cerrar"}
          className="absolute top-3 right-3 text-white/70 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-4">
          <div className="text-5xl mb-2">🎁</div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {t("referral.title")}
          </h2>
          <p className="text-emerald-200/80 text-sm">
            {t("referral.subtitle")}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 bg-black/30 rounded-xl p-1">
          <button
            onClick={() => setMode("invite")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === "invite" ? "bg-emerald-500 text-white" : "text-emerald-200"
            }`}
          >
            {t("referral.tab_invite")}
          </button>
          <button
            onClick={() => setMode("redeem")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === "redeem" ? "bg-emerald-500 text-white" : "text-emerald-200"
            }`}
          >
            {t("referral.tab_redeem")}
          </button>
        </div>

        {mode === "invite" && (
          <>
            {!user ? (
              <div className="text-center py-4 text-emerald-100">
                {t("referral.login_required")}
              </div>
            ) : stats.loading || !stats.code ? (
              <div className="text-center py-6 text-emerald-200">
                {t("referral.generating")}
              </div>
            ) : (
              <>
                {/* Rewards summary */}
                <div className="bg-black/30 rounded-xl p-3 mb-4 border border-emerald-400/30">
                  <p className="text-emerald-100 text-sm text-center mb-2 font-semibold">
                    {t("referral.how_it_works")}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-emerald-500/20 rounded-lg p-2">
                      <div className="text-2xl">👥</div>
                      <div className="text-yellow-300 font-bold text-lg">+50 💎</div>
                      <div className="text-emerald-200 text-xs">{t("referral.for_friend")}</div>
                    </div>
                    <div className="bg-emerald-500/20 rounded-lg p-2">
                      <div className="text-2xl">🏆</div>
                      <div className="text-yellow-300 font-bold text-lg">+150 💎</div>
                      <div className="text-emerald-200 text-xs">{t("referral.for_you")}</div>
                    </div>
                  </div>
                  <p className="text-emerald-300/70 text-xs text-center mt-2">
                    {t("referral.qualify_hint")}
                  </p>
                </div>

                {/* Your code */}
                <div className="mb-3">
                  <p className="text-emerald-200 text-xs mb-1">{t("referral.your_code")}</p>
                  <div className="bg-white/10 border-2 border-yellow-400/60 rounded-xl px-4 py-3 text-center">
                    <p className="text-2xl font-mono font-bold text-yellow-300 tracking-widest">
                      {stats.code}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="border-emerald-400/50 text-emerald-100 hover:bg-emerald-500/20"
                  >
                    {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    {copied ? t("referral.copied") : t("referral.copy")}
                  </Button>
                  <Button
                    onClick={handleShare}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    {t("referral.share")}
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 bg-black/20 rounded-xl p-3 border border-emerald-400/20">
                  <div className="text-center">
                    <Users className="w-5 h-5 mx-auto text-emerald-300" />
                    <div className="text-white font-bold text-lg">{stats.invitedCount}</div>
                    <div className="text-emerald-200/70 text-[10px]">{t("referral.stat_invited")}</div>
                  </div>
                  <div className="text-center">
                    <Check className="w-5 h-5 mx-auto text-emerald-300" />
                    <div className="text-white font-bold text-lg">{stats.qualifiedCount}</div>
                    <div className="text-emerald-200/70 text-[10px]">{t("referral.stat_qualified")}</div>
                  </div>
                  <div className="text-center">
                    <Gift className="w-5 h-5 mx-auto text-yellow-300" />
                    <div className="text-yellow-300 font-bold text-lg">{stats.totalGemsEarned}</div>
                    <div className="text-emerald-200/70 text-[10px]">{t("referral.stat_gems")}</div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {mode === "redeem" && (
          <>
            <div className="bg-black/30 rounded-xl p-3 mb-4 border border-emerald-400/30 text-center">
              <div className="text-3xl mb-1">🎁</div>
              <p className="text-yellow-300 font-bold text-lg">+50 💎</p>
              <p className="text-emerald-200 text-xs">{t("referral.redeem_hint")}</p>
            </div>

            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="MG-XXXXXX"
              maxLength={12}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border-2 border-emerald-400/40 text-white text-center text-lg font-mono tracking-widest placeholder:text-white/30 mb-3 focus:outline-none focus:border-yellow-400"
            />

            <Button
              onClick={handleRedeem}
              disabled={redeeming || !user}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
            >
              {redeeming ? t("referral.redeeming") : t("referral.redeem_btn")}
            </Button>
            {!user && (
              <p className="text-center text-emerald-200/70 text-xs mt-2">
                {t("referral.login_required")}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
