import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { useBackButton } from "@/hooks/useBackButton";
import { useGameState } from "@/hooks/useGameState";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { usePurchases } from "@/hooks/usePurchases";
import { usePendingPurchase } from "@/hooks/usePendingPurchase";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";
import { useAchievements } from "@/hooks/useAchievements";
import { useDailyStreak } from "@/hooks/useDailyStreak";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { usePurchaseGate, dispatchPurchaseCompleted } from "@/hooks/usePurchaseGate";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AuthPage } from "@/components/AuthPage";
import { GameHeader } from "@/components/GameHeader";
import { GameScreen } from "@/components/GameScreen";
import { LevelSelect } from "@/components/LevelSelect";
import { Shop } from "@/components/Shop";
import { NoLivesModal } from "@/components/NoLivesModal";
import { FirstDayOffer } from "@/components/game/FirstDayOffer";
import { LuckySpin } from "@/components/game/LuckySpin";
import { Tutorial } from "@/components/game/Tutorial";
import { ProgressionBar } from "@/components/game/ProgressionBar";
import { RewardedAds } from "@/components/game/RewardedAds";
import { DailyStreakCalendar } from "@/components/game/DailyStreakCalendar";
import { NotificationPrompt } from "@/components/game/NotificationPrompt";
import { ComeBackBanner } from "@/components/game/ComeBackBanner";
import { StreakReminderBanner } from "@/components/game/StreakReminderBanner";
import { ReviewRequestModal } from "@/components/game/ReviewRequestModal";
import { Day2UnlockBanner } from "@/components/game/Day2UnlockBanner";
import { FirstWinCelebration } from "@/components/game/FirstWinCelebration";
import { FirstSessionReward } from "@/components/game/FirstSessionReward";
import { SharePrompt } from "@/components/game/SharePrompt";
import { DayCounter } from "@/components/game/DayCounter";
import { SpringEvent } from "@/components/game/SpringEvent";
import { PlayerRank } from "@/components/game/PlayerRank";
import { AudioControls } from "@/components/game/AudioControls";
import { VisualGarden } from "@/components/game/VisualGarden";
import { LoginPrompt } from "@/components/game/LoginPrompt";
import { PurchaseLoadingOverlay } from "@/components/game/PurchaseLoadingOverlay";
import { ForceUpdateModal } from "@/components/game/ForceUpdateModal";
import { ReviewPrompt } from "@/components/ReviewPrompt";
import { PiggyBank } from "@/components/PiggyBank";
import { PiggyBankModal } from "@/components/PiggyBankModal";
import { StreakBonusOffer } from "@/components/offers/StreakBonusOffer";
import { WinStreakOffer } from "@/components/offers/WinStreakOffer";
import { usePiggyBank } from "@/hooks/usePiggyBank";
import { useSeasonPass } from "@/hooks/useSeasonPass";
import { useWinStreak } from "@/hooks/useWinStreak";
import { LS_KEYS } from "@/constants/localStorageKeys";

// Lazy-loaded non-critical modals
const PostVictoryOffer = lazy(() => import("@/components/game/PostVictoryOffer").then(m => ({ default: m.PostVictoryOffer })));
const BattlePass = lazy(() => import("@/components/game/BattlePass").then(m => ({ default: m.BattlePass })));
const DailyMissions = lazy(() => import("@/components/game/DailyMissions").then(m => ({ default: m.DailyMissions })));
const LootChest = lazy(() => import("@/components/game/LootChest").then(m => ({ default: m.LootChest })));
const FlashOffer = lazy(() => import("@/components/game/FlashOffer").then(m => ({ default: m.FlashOffer })));
const AchievementModal = lazy(() => import("@/components/game/AchievementModal").then(m => ({ default: m.AchievementModal })));
const ExitConfirmModal = lazy(() => import("@/components/game/ExitConfirmModal").then(m => ({ default: m.ExitConfirmModal })));
const StarterPack = lazy(() => import("@/components/game/StarterPack").then(m => ({ default: m.StarterPack })));
const WelcomeOffer = lazy(() => import("@/components/game/WelcomeOffer").then(m => ({ default: m.WelcomeOffer })));
const PaymentSuccessModal = lazy(() => import("@/components/game/PaymentSuccessModal").then(m => ({ default: m.PaymentSuccessModal })));
import { useAppUpdate } from "@/hooks/useAppUpdate";
import { signInWithGoogleNative, signInWithGoogleWeb } from "@/lib/googleAuth";
import { hasSeenWelcomeOffer, canShowOfferToday, markOfferShown, emitAnalyticsEvent } from "@/lib/analytics";
import { trackEvent } from "@/lib/trackEvent";
import { Button } from "@/components/ui/button";
import { LEVELS } from "@/data/levels";
import { PRODUCTS } from "@/data/products";
import { markStarterGemsAsPurchased } from "@/utils/purchaseUtils";
import { canShowStarterGems, markStarterGemsShown, markStarterGemsDismissed } from "@/utils/starterGemsGate";
import { isPostDefeatOfferLocked, clearPostDefeatOfferLock, lockPostDefeatOffers } from "@/utils/postDefeatOfferLock";
import { isPostVictoryOfferLocked, clearPostVictoryOfferLock, getPostVictoryOfferLockSource } from "@/utils/postVictoryOfferLock";
import { PersonalizeHeroButton } from "@/components/game/PersonalizeHeroButton";
import { CustomizeIntroModal } from "@/components/game/CustomizeIntroModal";
import { EndOfSessionBanner } from "@/components/game/EndOfSessionBanner";
import { markWinStreakPowerupPending } from "@/utils/winStreakPowerup";
import { incrementMission } from "@/utils/missionTracker";
import { SettingsModal } from "@/components/game/SettingsModal";
import { toast } from "sonner";
import { Play, Grid3x3, ShoppingBag, User, Crown, Flame, DoorOpen, Gift, Target, Palette, HelpCircle, Settings as SettingsIcon } from "lucide-react";
import { LevelMap } from "@/components/menu/LevelMap";
import { SideIconsColumn } from "@/components/menu/SideIconsColumn";
import { WatchAdCornerButton } from "@/components/menu/WatchAdCornerButton";
import { SplashScreen } from "@/components/SplashScreen";
import { CustomizeScreen } from "@/components/CustomizeScreen";
import { HowToPlayScreen } from "@/components/HowToPlayScreen";
import { ThemeUnlockedModal } from "@/components/themes/ThemeUnlockedModal";
import { THEME_MAP, type ThemeId } from "@/data/themes";
import { useUserThemes } from "@/hooks/useUserThemes";
type Screen = "menu" | "game" | "levels" | "shop" | "customize" | "howtoplay";
const Index = () => {
  const navigate = useNavigate();
  const adminTapsRef = useRef<number[]>([]);
  const { t } = useLanguage();
  const appUpdate = useAppUpdate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { hasActiveProduct } = usePurchases(user);
  const { setScreen: setMusicScreen } = useBackgroundMusic("menu");
  const {
    gameState,
    loading: gameLoading,
    loseLife,
    addLives,
    addGems,
    spendGems,
    completeLevel,
    selectLevel,
    activateUnlimitedLives,
    hasUnlimitedLives,
    getTimeUntilNextLife,
    setOnLivesFull,
    addHammer,
    addUndo,
    addShuffle,
    useHammer,
    useUndo,
    useShuffle,
    reloadFromDB,
  } = useGameState();

  const { maybeAutoUnlockByLevel, setActiveTheme } = useUserThemes();
  const { newlyUnlocked, clearNewlyUnlocked, checkLevelAchievements, checkGemsAchievements } = useAchievements(
    user?.id,
  );
  const [screen, setScreenState] = useState<Screen>("menu");
  const [recentUnlockedTheme, setRecentUnlockedTheme] = useState<ThemeId | null>(null);

  // Sync music volume with screen changes
  const setScreen = useCallback(
    (newScreen: Screen) => {
      trackEvent('screen_view', { screen: newScreen });
      setScreenState(newScreen);
      setMusicScreen(newScreen === "customize" || newScreen === "howtoplay" ? "menu" : newScreen);
    },
    [setMusicScreen],
  );
  const [showNoLivesModal, setShowNoLivesModal] = useState(false);
  const [showBattlePass, setShowBattlePass] = useState(false);
  const [showStreakCalendar, setShowStreakCalendar] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showFirstWin, setShowFirstWin] = useState(false);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [showAdModal, setShowAdModal] = useState(false);

  // New monetization modals
  const [showFlashOffer, setShowFlashOffer] = useState(false);
  const [showPostVictoryOffer, setShowPostVictoryOffer] = useState(false);
  const [showDailyMissions, setShowDailyMissions] = useState(false);
  const [showLootChest, setShowLootChest] = useState(false);
  const [showStarterPack, setShowStarterPack] = useState(false);
  const [lastCompletedLevel, setLastCompletedLevel] = useState(0);
  const [lastWinGems, setLastWinGems] = useState(0);
  const [consecutiveLosses, setConsecutiveLosses] = useState(0);
  const [consecutiveLossesByLevel, setConsecutiveLossesByLevel] = useState<Record<number, number>>({});

  // CAMBIO 2 — modal de personalización tras nivel 1
  const [showCustomizeIntro, setShowCustomizeIntro] = useState(false);

  // CAMBIO 10 — banner end-of-session (al volver al menú desde partida)
  const [showEndOfSessionBanner, setShowEndOfSessionBanner] = useState(false);

  // Daily Streak & Push Notifications
  const { streakData, claimDailyReward } = useDailyStreak();
  const { scheduleLivesFullNotification, scheduleStreakReminder, sendLivesFullNotification, scheduleNotification, requestPermission, permission, isSupported } = usePushNotifications();

  const [showFirstSessionReward, setShowFirstSessionReward] = useState(false);
  const [suppressAutoPopups, setSuppressAutoPopups] = useState(false);
  const [showLuckySpin, setShowLuckySpin] = useState(false);
  const [showSpringEvent, setShowSpringEvent] = useState(false);
  const [showComeBackBanner, setShowComeBackBanner] = useState(false);
  const [comebackDays, setComebackDays] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // ===== T5/T7/T9: Piggy Bank, Season Pass, Win Streak =====
  const piggyBank = usePiggyBank(user?.id ?? null);
  const seasonPass = useSeasonPass(user?.id ?? null);
  const winStreak = useWinStreak();
  const [showPiggyModal, setShowPiggyModal] = useState(false);
  const [showWinStreakOffer, setShowWinStreakOffer] = useState(false);
  const [showStreakBonusOffer, setShowStreakBonusOffer] = useState<5 | 7 | null>(null);

  // ===== Anti-avalanche popup queue (sessionStorage, never unset within session) =====
  const ENGAGEMENT_FLAG_KEY = 'engagement_popup_shown_session';
  const LOGIN_TIMESTAMP_KEY = 'login_timestamp_session';
  const LOGIN_COOLDOWN_MS = 60_000;

  const isEngagementShown = () => {
    try { return sessionStorage.getItem(ENGAGEMENT_FLAG_KEY) === 'true'; } catch { return false; }
  };
  const tryClaimEngagementSlot = () => {
    if (isEngagementShown()) return false;
    try { sessionStorage.setItem(ENGAGEMENT_FLAG_KEY, 'true'); } catch {}
    return true;
  };

  const [loginCooldownActive, setLoginCooldownActive] = useState(() => {
    try {
      const ts = sessionStorage.getItem(LOGIN_TIMESTAMP_KEY);
      return ts ? Date.now() - parseInt(ts) < LOGIN_COOLDOWN_MS : false;
    } catch { return false; }
  });

  // Listen for SIGNED_IN to start cooldown window
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        try { sessionStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString()); } catch {}
        setLoginCooldownActive(true);
        setTimeout(() => setLoginCooldownActive(false), LOGIN_COOLDOWN_MS);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Restore remaining cooldown on mount
  useEffect(() => {
    if (!loginCooldownActive) return;
    try {
      const ts = sessionStorage.getItem(LOGIN_TIMESTAMP_KEY);
      if (!ts) return;
      const remaining = LOGIN_COOLDOWN_MS - (Date.now() - parseInt(ts));
      if (remaining > 0) {
        const t = setTimeout(() => setLoginCooldownActive(false), remaining);
        return () => clearTimeout(t);
      }
      setLoginCooldownActive(false);
    } catch {}
  }, []);

  // Sync starter_gems purchase state from Supabase
  useEffect(() => {
    if (!user) return;
    const syncStarterGems = async () => {
      const { data } = await supabase
        .from('user_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', 'starter_gems')
        .limit(1);
      if (data && data.length > 0) {
        console.log("[Index] Sync: starter_gems found in server, marking locally");
        markStarterGemsAsPurchased();
      }
    };
    syncStarterGems();
  }, [user]);

  // Gating: Sesión 1 = 0 niveles completados. Bloquea engagement popups.
  const isFirstSession = gameState.completedLevels.length === 0;
  const autoPopupsBlocked = suppressAutoPopups || showFirstSessionReward || isFirstSession || loginCooldownActive;
  const odId = user?.id || 'guest';

  // Orquestador LuckySpin — BUG 1 fix: slot PROPIO (no compite con streak/spring/missions).
  // Trigger: 3+ niveles completados + >=24h desde último giro real. Sin cool-down "prompt de hoy".
  useEffect(() => {
    if (autoPopupsBlocked || gameState.completedLevels.length < 3) return;
    const luckySlotKey = 'lucky_spin_shown_session';
    if (sessionStorage.getItem(luckySlotKey) === 'true') return;
    const lastSpin = localStorage.getItem(`last-spin-${odId}`);
    const canOffer = !lastSpin || (Date.now() - new Date(lastSpin).getTime()) / 3600000 >= 24;
    if (!canOffer) return;
    const timer = setTimeout(() => {
      try { sessionStorage.setItem(luckySlotKey, 'true'); } catch {}
      setShowLuckySpin(true);
    }, 1800);
    return () => clearTimeout(timer);
  }, [autoPopupsBlocked, gameState.completedLevels.length, odId]);

  // Orquestador SpringEvent (Gating nivel 8) — P4 2000ms
  useEffect(() => {
    if (autoPopupsBlocked || gameState.completedLevels.length < 8) return;
    const seenToday = localStorage.getItem('spring-event-seen') === new Date().toDateString();
    if (!seenToday) {
      const timer = setTimeout(() => {
        if (tryClaimEngagementSlot()) setShowSpringEvent(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [autoPopupsBlocked, gameState.completedLevels.length]);

  // Orquestador ComeBackBanner — P1 (immediate)
  useEffect(() => {
    if (autoPopupsBlocked) return;
    const lastSessionKey = `last-session-${odId}`;
    const claimedKey = `comeback-claimed-${odId}`;
    const lastSession = localStorage.getItem(lastSessionKey);
    const alreadyClaimed = localStorage.getItem(claimedKey);
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(lastSessionKey, today);
    if (lastSession && !alreadyClaimed) {
      const lastDate = new Date(lastSession);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000);
      if (diffDays >= 2) {
        if (tryClaimEngagementSlot()) {
          setComebackDays(diffDays);
          setShowComeBackBanner(true);
        }
      }
    }
  }, [autoPopupsBlocked, odId]);

  // Orquestador ReviewRequest (Threshold: Lvl 10 + 5 partidas) — P5 3000ms
  useEffect(() => {
    if (autoPopupsBlocked || gameState.completedLevels.length < 10 || gamesPlayed < 5) return;
    const reviewAskedKey = `review-asked-${odId}`;
    if (!localStorage.getItem(reviewAskedKey)) {
      const timer = setTimeout(() => {
        if (tryClaimEngagementSlot()) {
          setShowReviewModal(true);
          localStorage.setItem(reviewAskedKey, 'true');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [autoPopupsBlocked, gameState.completedLevels.length, gamesPlayed, odId]);

  const handleClaimComeBackReward = (gems: number, lives: number) => {
    addGems(gems);
    addLives(lives);
    setShowComeBackBanner(false);
  };

  // Track guest session on mount (anonymous users)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      trackEvent('guest_session', { screen: 'menu' });
    }
  }, [authLoading, user]);

  // Limpiar prompt de login si se detecta usuario (ej: tras login exitoso)
  useEffect(() => {
    if (user) {
      setShowLoginPrompt(null);
    }
  }, [user]);

  // Re-engagement notifications: 2h, 24h, 72h after first session
  useEffect(() => {
    if (authLoading) return;
    const reEngageKey = 're_engage_scheduled';
    if (localStorage.getItem(reEngageKey)) return;

    // Request permission silently (will prompt once)
    if (isSupported && permission === 'default') {
      // Don't prompt immediately — wait until level 1 completed
      return;
    }
    if (!isSupported || permission !== 'granted') return;

    localStorage.setItem(reEngageKey, 'true');
    // 2 hours — gentle reminder
    scheduleNotification('level_milestone', 2 * 60 * 60 * 1000, { levels: '1' });
    // 24 hours
    scheduleNotification('come_back', 24 * 60 * 60 * 1000, { days: '1' });
    // 72 hours
    scheduleNotification('come_back', 72 * 60 * 60 * 1000, { days: '3' });
  }, [authLoading, isSupported, permission, scheduleNotification]);

  // State for welcome offer (post-level-1)
  const [showWelcomeOffer, setShowWelcomeOffer] = useState(false);
  // Payment success modal
  const [paymentModal, setPaymentModal] = useState<{ show: boolean; productName: string; rewardText: string }>({
    show: false,
    productName: "",
    rewardText: "",
  });
  // State for login prompt (guest mode)
  const [showLoginPrompt, setShowLoginPrompt] = useState<"purchase" | "save_progress" | "general" | null>(null);
  // Purchase gate - bloquea shop hasta primera compra
  const { hasPurchasedOnce, isShopLocked } = usePurchaseGate();
  // En Android los grants vienen del flujo nativo verificado; los callbacks UI no deben volver a otorgarlos.
  const shouldApplyClientPersistentRewards = Capacitor.getPlatform() !== "android";
  // Android back button: navegación inmediata y salida solo en menú
  useBackButton(
    useCallback(() => {
      if (screen === "shop" || screen === "levels" || screen === "game") {
        setScreen("menu");
        return false;
      }
      setShowExitModal(true);
      return false;
    }, [screen, setScreen]),
  );
  // Estado de pago pendiente (para restaurar después de Stripe)
  const { pendingState, paymentSuccess, verifiedProductId, clearPendingState } = usePendingPurchase();

  // Estado para restaurar el juego después de pago
  const [restoredGameState, setRestoredGameState] = useState<{
    moves: number;
    score: number;
    collected: Record<string, number>;
  } | null>(null);
  // Detectar pago Stripe verificado — webhook ya aplicó recompensas, solo mostrar modal + recargar DB
  useEffect(() => {
    if (!paymentSuccess || !verifiedProductId) return;
    const productId = verifiedProductId;
    console.log("[Index] ✅ Pago Stripe verificado. Webhook ya aplicó recompensas. Recargando desde DB:", productId);
    // Restore game state for in-level purchases (moves context only, no rewards)
    if (["buy_moves", "finish_level", "continue_game", "extra_moves"].includes(productId) && pendingState) {
      selectLevel(pendingState.levelId);
      setRestoredGameState({
        moves: 5,
        score: pendingState.score,
        collected: pendingState.collected,
      });
      setScreen("game");
    }
    // Reward text map (display only — rewards come from webhook)
    const REWARD_DISPLAY: Record<string, { name: string; text: string }> = {
      starter_gems: { name: "Inicio Mágico", text: "+400 gemas añadidas" },
      gems_100: { name: "100 Gemas 💎", text: "+100 gemas añadidas" },
      gems_300: { name: "300 Gemas 💎", text: "+300 gemas añadidas" },
      gems_1200: { name: "1200 Gemas 💎", text: "+1200 gemas añadidas" },
      quick_pack: { name: "Quick Pack", text: "+3 vidas y +20 gemas" },
      mega_pack_inicial: { name: "Mega Pack", text: "+500 gemas, +10 vidas, +3 powerups, +1 día sin ads" },
      starter_pack: { name: "Starter Pack", text: "+500 gemas, +10 vidas, +3 powerups" },
      reward_doubler: { name: "Reward Doubler", text: "+50 gemas bonus" },
      extra_spin: { name: "Giro Extra", text: "¡Giro extra desbloqueado!" },
      garden_pass: { name: "Garden Pass 🌸", text: "+1000 gemas + Sin anuncios 30 días" },
      welcome_pack: { name: "Welcome Pack", text: "+5 powerups y +3 vidas" },
      first_purchase: { name: "Welcome Pack", text: "+500 gemas, +20 vidas, +1 día sin ads" },
      lifesaver_pack: { name: "Lifesaver Pack", text: "+1 vida y +3 powerups" },
      flash_offer: { name: "Flash Offer", text: "+10 vidas y +150 gemas" },
      victory_multiplier: { name: "Victory Multiplier", text: "+2 vidas" },
      pack_revancha: { name: "Pack Revancha", text: "+50 gemas, +5 vidas, +5 powerups" },
      unlimited_lives_30min: { name: "Vidas Infinitas ♾️", text: "¡30 minutos de vidas ilimitadas!" },
      no_ads_month: { name: "Sin Anuncios 🚫", text: "¡30 días sin anuncios!" },
      no_ads_forever: { name: "Sin Anuncios Forever 🚫", text: "¡Sin anuncios para siempre!" },
      buy_moves: { name: "+5 Movimientos", text: "¡Continúa tu partida con 5 movimientos extra!" },
      finish_level: { name: "+5 Movimientos", text: "¡Continúa tu partida!" },
      continue_game: { name: "+5 Movimientos", text: "¡Continúa tu partida!" },
      extra_moves: { name: "+5 Movimientos", text: "¡Movimientos extra añadidos!" },
      streak_protection: { name: "Streak Protection", text: "¡Racha protegida!" },
      first_day_offer: { name: "First Day Offer", text: "+5 powerups y +3 vidas" },
      pack_victoria_segura: { name: "Pack Victoria Segura", text: "+5 powerups y +3 vidas" },
      pack_racha_infinita: { name: "Pack Racha Infinita", text: "+2 vidas" },
      pack_impulso: { name: "Pack Impulso", text: "+5 powerups y +3 vidas" },
      pack_experiencia: { name: "Pack Experiencia", text: "+2 vidas" },
      pack_victoria_segura_pro: { name: "Pack Victoria Segura Pro", text: "+8 powerups y +3 vidas" },
      chest_silver: { name: "Cofre de Plata", text: "¡Cofre abierto!" },
      chest_gold: { name: "Cofre de Oro", text: "¡Cofre dorado abierto!" },
    };
    const display = REWARD_DISPLAY[productId] || { name: "Compra", text: "¡Recompensa aplicada con éxito!" };
    
    // Capa 1: Marcar compra de pack inicial si aplica
    if (productId === 'starter_gems') {
      console.log("[Index] Marcando starter_gems como comprado tras éxito Stripe");
      markStarterGemsAsPurchased();
    }

    dispatchPurchaseCompleted(productId);
    // Show success modal
    setPaymentModal({ show: true, productName: display.name, rewardText: display.text });
    toast.success("✅ ¡Pago completado!");
    // Reload from DB to get the rewards the webhook already applied
    reloadFromDB?.();
    clearPendingState();
  }, [paymentSuccess, verifiedProductId, pendingState, selectLevel, setScreen, clearPendingState, reloadFromDB]);

  useEffect(() => {
    const handleLuckySpinReward = (event: Event) => {
      const detail = (event as CustomEvent<{ gems?: number }>).detail;
      const gems = detail?.gems ?? 0;
      if (gems > 0) {
        addGems(gems);
      }
    };

    window.addEventListener("lucky_spin_reward", handleLuckySpinReward);
    return () => window.removeEventListener("lucky_spin_reward", handleLuckySpinReward);
  }, [addGems]);
  // Auto-show streak calendar con control anti-bucle (una vez al día, después de nivel 5) — P2 1200ms
  useEffect(() => {
    if (autoPopupsBlocked) return;
    if (!streakData.canClaimToday || !user || gameState.completedLevels.length < 5) return;
    const today = new Date().toISOString().split("T")[0];
    const autoShownKey = `streak-auto-shown-${user.id}-${today}`;
    if (localStorage.getItem(autoShownKey)) return;
    const timer = setTimeout(() => {
      if (tryClaimEngagementSlot()) {
        setShowStreakCalendar(true);
        localStorage.setItem(autoShownKey, "true");
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [autoPopupsBlocked, streakData.canClaimToday, user, gameState.completedLevels.length]);

  useEffect(() => {
    if (showFirstSessionReward || suppressAutoPopups) return;
    if (screen !== "menu") return;
    if (isNaN(lastCompletedLevel) || lastCompletedLevel !== 5) return;
    if (localStorage.getItem("first_session_reward_claimed") === "true") return;

    setShowFirstSessionReward(true);
    setSuppressAutoPopups(true);
  }, [lastCompletedLevel, screen, showFirstSessionReward, suppressAutoPopups]);

  useEffect(() => {
    if (screen !== "menu") {
      setSuppressAutoPopups(false);
    }
  }, [screen]);
  // Schedule streak reminder if user has a streak (at 20:30 prime time)
  useEffect(() => {
    if (streakData.currentStreak > 0 && !streakData.canClaimToday) {
      scheduleStreakReminder(streakData.currentStreak);
    }
  }, [streakData.currentStreak, streakData.canClaimToday, scheduleStreakReminder]);

  // T6 — Show streak bonus offer at day 5 and day 7 (once per milestone, 24h cooldown)
  useEffect(() => {
    if (autoPopupsBlocked) return;
    if (gameState.completedLevels.length < 5) return;
    const streak = streakData.currentStreak;
    if (streak !== 5 && streak !== 7) return;
    const key = streak === 5 ? LS_KEYS.STREAK_BONUS_5_LAST_SHOWN : LS_KEYS.STREAK_BONUS_7_LAST_SHOWN;
    const last = parseInt(localStorage.getItem(key) ?? "0", 10);
    if (Date.now() - last < 24 * 60 * 60 * 1000) return;
    if (isPostVictoryOfferLocked()) {
      trackEvent("offer_suppressed", { source: "StreakBonusOffer", reason: "post_victory_offer_lock", active_id: getPostVictoryOfferLockSource(), streakDays: streak });
      return;
    }
    if (!tryClaimEngagementSlot()) return;
    localStorage.setItem(key, String(Date.now()));
    trackEvent("streak_bonus_offer_shown", { streakDays: streak });
    setTimeout(() => setShowStreakBonusOffer(streak as 5 | 7), 1500);
  }, [streakData.currentStreak, autoPopupsBlocked, gameState.completedLevels.length]);

  // Set up notification when lives become full
  useEffect(() => {
    setOnLivesFull(() => {
      sendLivesFullNotification();
    });
  }, [setOnLivesFull, sendLivesFullNotification]);
  // Listen for login requests from payment hooks (guest trying to buy)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setShowLoginPrompt(detail?.reason || "purchase");
    };
    window.addEventListener("request_login", handler);
    return () => window.removeEventListener("request_login", handler);
  }, []);
  // Prompt save progress after level 5 for guests
  useEffect(() => {
    if (!user && gameState.completedLevels.length === 5) {
      const prompted = localStorage.getItem("save_progress_prompted");
      if (!prompted) {
        setTimeout(() => setShowLoginPrompt("save_progress"), 2000);
        localStorage.setItem("save_progress_prompted", "true");
      }
    }
  }, [user, gameState.completedLevels.length]);
  // Music is now auto-started by useBackgroundMusic hook
  const currentLevel = LEVELS.find((l) => l.id === gameState.currentLevel) || LEVELS[0];
  const handlePlayClick = () => {
    if (gameState.lives > 0 || hasUnlimitedLives()) {
      // CAMBIO 1 — NO se consume vida al entrar; sólo al perder/abandonar
      clearPostDefeatOfferLock();
      clearPostVictoryOfferLock();
      trackEvent("level_start", {
        level: currentLevel.id,
        source: "play_button",
        guest: !user,
      });
      setScreen("game");
    } else {
      if (isPostDefeatOfferLocked()) {
        trackEvent("no_lives_modal_suppressed", { trigger: "retry", reason: "post_defeat_offer_lock" });
      } else {
        trackEvent("no_lives_modal_shown", { trigger: "retry" });
        setShowNoLivesModal(true);
      }
    }
  };
  const handleWin = useCallback(
    async (stars: number, reward: { gems?: number }, telemetry?: { score: number; moves_used: number }) => {
      const isBonus = !!currentLevel.bonus;
      completeLevel(currentLevel.id, reward, !isBonus, stars);
      trackEvent('level_completed', {
        level: currentLevel.id,
        bonus: isBonus,
        score: telemetry?.score ?? null,
        moves_used: telemetry?.moves_used ?? null,
      });

      toast.success(`${t("game.win")}${reward.gems ? ` +${reward.gems} 💎` : ""}`);

      setConsecutiveLosses(0);
      setConsecutiveLossesByLevel((prev) => ({ ...prev, [currentLevel.id]: 0 }));

      setLastCompletedLevel(currentLevel.id);
      setGamesPlayed((prev) => prev + 1);

      // BUG 4 fix — misión diaria "Completa X niveles"
      try { incrementMission('levels', user?.id ?? null); } catch {}

      const completedCount = gameState.completedLevels.length + 1;
      await checkLevelAchievements(completedCount);
      if (reward.gems) await checkGemsAchievements(gameState.gems + reward.gems);

      if (currentLevel.id === 1 && !localStorage.getItem(LS_KEYS.CUSTOMIZE_INTRO_SHOWN)) {
        trackEvent('customize_intro_shown', {});
        setShowCustomizeIntro(true);
      }

      if (currentLevel.id === 1 && isSupported && permission === 'default') {
        setTimeout(() => requestPermission(), 5000);
      }
      if (currentLevel.id === 3) {
        const giftKey = `level3_gift_${user?.id || 'guest'}`;
        if (!localStorage.getItem(giftKey)) {
          localStorage.setItem(giftKey, 'true');
          addGems(20);
          toast.success('🎁 ¡Regalo! +20 gemas gratis por completar el nivel 3');
          trackEvent('free_gems_gifted', { level: 3, gems: 20 });
        }
      }

      if (currentLevel.id >= 6 && reward.gems && reward.gems > 0 && !isBonus) {
        setLastWinGems(reward.gems);
        if (isPostVictoryOfferLocked()) {
          trackEvent("offer_suppressed", { source: "PostVictoryOffer", reason: "post_victory_offer_lock", active_id: getPostVictoryOfferLockSource(), level: currentLevel.id });
        } else {
          trackEvent("victory_celebration_shown", { level: currentLevel.id, gems_reward: reward.gems });
          setTimeout(() => setShowPostVictoryOffer(true), 1500);
        }
      }

      if (!isBonus) piggyBank.deposit(5).catch(() => {});
      if (!isBonus) seasonPass.addProgress(50).catch(() => {});
      const newStreak = isBonus ? winStreak.count : winStreak.registerWin();

      if (!isBonus && newStreak >= 3) markWinStreakPowerupPending();

      if (newStreak === 3 && !isBonus) {
        const lastShown = parseInt(localStorage.getItem(LS_KEYS.WIN_STREAK_OFFER_LAST_SHOWN) ?? "0", 10);
        if (Date.now() - lastShown > 24 * 60 * 60 * 1000) {
          if (isPostVictoryOfferLocked()) {
            trackEvent("offer_suppressed", { source: "WinStreakOffer", reason: "first_day_active", active_id: getPostVictoryOfferLockSource(), level: currentLevel.id });
          } else {
            localStorage.setItem(LS_KEYS.WIN_STREAK_OFFER_LAST_SHOWN, String(Date.now()));
            setTimeout(() => setShowWinStreakOffer(true), 1800);
          }
        }
      }

      if (!isBonus) {
        const unlockedThemeId = await maybeAutoUnlockByLevel();
        if (unlockedThemeId) {
          setRecentUnlockedTheme(unlockedThemeId);
        }
      }

      setShowEndOfSessionBanner(true);
      setScreen("menu");
    },
    [
      completeLevel,
      currentLevel.id,
      currentLevel.bonus,
      t,
      gameState.completedLevels.length,
      gameState.gems,
      checkLevelAchievements,
      checkGemsAchievements,
      piggyBank,
      seasonPass,
      winStreak,
    ],
  );
  const handleLose = useCallback((payload?: { progress_pct: number; progress_abs: number; target: number; moves_left: number; score: number; moves_used: number }) => {
    // CAMBIO 1 — perder consume vida
    loseLife();
    trackEvent('life_consumed', { reason: 'lose', level: currentLevel.id });
    winStreak.registerLoss();
    // CAMBIO 5A — payload con near-miss data + telemetría de scoring
    trackEvent("level_failed", {
      level: currentLevel.id,
      consecutive_losses: consecutiveLosses + 1,
      guest: !user,
      progress_pct: payload?.progress_pct ?? null,
      progress_abs: payload?.progress_abs ?? null,
      target: payload?.target ?? null,
      moves_left: payload?.moves_left ?? null,
      score: payload?.score ?? null,
      moves_used: payload?.moves_used ?? null,
    });

    toast.error(t("game.lose"));
    setGamesPlayed((prev) => prev + 1);

    // Tracked per-level for adaptive difficulty
    setConsecutiveLossesByLevel((prev) => ({
      ...prev,
      [currentLevel.id]: (prev[currentLevel.id] ?? 0) + 1,
    }));

    setConsecutiveLosses((prev) => {
      const newCount = prev + 1;
      if (newCount >= 3 && currentLevel.id >= 5) {
        setTimeout(() => {
          lockPostDefeatOffers("flash_offer");
          setShowFlashOffer(true);
        }, 1000);
      }
      return newCount;
    });
    if (currentLevel.id >= 4 && !hasSeenWelcomeOffer() && canShowStarterGems()) {
      setTimeout(() => {
        if (isPostDefeatOfferLocked()) {
          trackEvent("offer_suppressed", { offer: "starter_gems", reason: "post_defeat_offer_lock", level: currentLevel.id });
          return;
        }
        emitAnalyticsEvent("first_purchase_offer_shown", { product: "starter_gems", level: currentLevel.id });
        trackEvent("offer_shown", { offer: "starter_gems", productId: "starter_gems", product: "starter_gems", trigger: "defeat", source: "auto_popup", level: currentLevel.id });
        markStarterGemsShown();
        setShowStarterPack(true);
        markOfferShown();
      }, 1500);
    }

    setShowEndOfSessionBanner(true);
    setScreen("menu");
  }, [t, currentLevel.id, consecutiveLosses, user, loseLife, winStreak]);

  // CAMBIO 1 — quit a media partida también consume vida
  const handleQuitMidGame = useCallback(() => {
    loseLife();
    trackEvent('life_consumed', { reason: 'quit', level: currentLevel.id });
    setShowEndOfSessionBanner(true);
    setScreen("menu");
  }, [loseLife, currentLevel.id]);
  const handleSelectLevel = (levelId: number) => {
    const maxUnlockedLevel = Math.max(1, ...gameState.completedLevels) + 1;
    const lvl = LEVELS.find((l) => l.id === levelId);
    const isBonus = !!lvl?.bonus;
    const baseId = isBonus ? levelId - 100 : levelId;
    const unlocked = isBonus
      ? gameState.completedLevels.includes(baseId)
      : levelId <= maxUnlockedLevel;
    if (!unlocked) {
      toast.error("Nivel bloqueado. Completa niveles anteriores.");
      return;
    }
    if (gameState.lives > 0 || hasUnlimitedLives()) {
      selectLevel(levelId);
      // CAMBIO 1 — NO se consume vida al entrar
      clearPostDefeatOfferLock();
      clearPostVictoryOfferLock();
      trackEvent("level_start", {
        level: levelId,
        source: "level_select",
        guest: !user,
        bonus: isBonus,
      });
      setScreen("game");
    } else {
      if (isPostDefeatOfferLocked()) {
        trackEvent("no_lives_modal_suppressed", { trigger: "level_select", reason: "post_defeat_offer_lock" });
      } else {
        trackEvent("no_lives_modal_shown", { trigger: "level_select" });
        setShowNoLivesModal(true);
      }
    }
  };
  const applyLocalProductEffects = useCallback(
    (productId: string) => {
      const product = PRODUCTS.find((p) => p.id === productId);
      if (!product) return false;

      // Gem grants: only apply locally for guests (no DB). For authenticated
      // users the server (Stripe verify edge function) already credited gems
      // in DB and reloadFromDB() will refresh state — skipping avoids both
      // double-grant and the >500 gem-delta guard trigger on game_progress.
      const isGuest = !user;
      if (isGuest) {
        if (product.amount) addGems(product.amount);
        if (product.instantGems) addGems(product.instantGems);
        if (product.gems) addGems(product.gems);
      }

      if (product.lives && product.lives !== "unlimited") {
        addLives(product.lives);
      }

      if (product.lives === "unlimited") {
        activateUnlimitedLives(0.5);
      }

      if (product.powerups) {
        const perType = Math.floor(product.powerups / 3);
        const remainder = product.powerups % 3;

        for (let i = 0; i < perType; i++) {
          addHammer();
          addShuffle();
          addUndo();
        }

        if (remainder >= 1) addHammer();
        if (remainder >= 2) addShuffle();
      }

      return true;
    },
    [user, activateUnlimitedLives, addGems, addHammer, addLives, addShuffle, addUndo],
  );


  const handlePurchase = async (productId: string) => {
    const isAndroidPlatform = Capacitor.getPlatform() === "android";
    if (isAndroidPlatform) {
      // Android purchases are handled by the first_purchase_completed listener above
      // (server rewards for guests, reloadFromDB for authenticated users)
      console.log("[PURCHASE] Android purchase completed for:", productId);
      setScreen("menu");
      return;
    }
    // Web: apply local grants (Stripe flow reloads from DB via payment success handler)
    if (applyLocalProductEffects(productId)) {
      setScreen("menu");
    }
  };

  // 🔑 Listen for Android Google Play purchases — apply server rewards for guests
  useEffect(() => {
    const handleGooglePlayRewards = (event: Event) => {
      const detail = ((event as CustomEvent).detail ?? {}) as {
        productId?: string;
        rewards?: {
          gems?: number;
          lives?: number;
          powerups?: number;
          unlimitedLivesMinutes?: number;
        };
      };
      
      const isAndroidPlatform = Capacitor.getPlatform() === "android";
      if (!isAndroidPlatform) return; // Only for Android purchases
      
      if (user) {
        // Authenticated user: server already applied rewards to DB, just reload
        console.log("[PURCHASE] Authenticated Android — reloading from DB after Google Play purchase");
        reloadFromDB();
        return;
      }

      // Guest Android: apply server rewards locally
      const { productId, rewards } = detail;

      if (productId === 'starter_gems') {
        console.log("[Index] Marcando starter_gems como comprado tras éxito Google Play (Guest)");
        markStarterGemsAsPurchased();
      }

      if (!rewards) {
        if (productId && applyLocalProductEffects(productId)) {
          console.log("[PURCHASE] Guest Android — applying fallback catalog rewards:", productId);
        }
        return;
      }

      console.log("[PURCHASE] Guest Android — applying server rewards locally:", rewards);
      
      if (rewards.gems) addGems(rewards.gems);
      if (rewards.lives) addLives(rewards.lives);
      if (rewards.powerups) {
        const perType = Math.floor(rewards.powerups / 3);
        const remainder = rewards.powerups % 3;
        for (let i = 0; i < perType; i++) {
          addHammer();
          addShuffle();
          addUndo();
        }
        if (remainder >= 1) addHammer();
        if (remainder >= 2) addShuffle();
      }
      if (rewards.unlimitedLivesMinutes) {
        activateUnlimitedLives(rewards.unlimitedLivesMinutes / 60);
      }
    };

    window.addEventListener("first_purchase_completed", handleGooglePlayRewards);
    return () => window.removeEventListener("first_purchase_completed", handleGooglePlayRewards);
  }, [user, reloadFromDB, addGems, addLives, addHammer, addShuffle, addUndo, activateUnlimitedLives, applyLocalProductEffects]);
  const handleQuickLifePurchased = ({ lives, gems }: { lives: number; gems: number }) => {
    if (lives > 0) addLives(lives);
    if (gems > 0) addGems(gems);
    toast.success(`¡Compra completada! +${lives}❤️ +${gems}💎`);
    setShowNoLivesModal(false);
  };
  const handleUseGemsForLife = () => {
    if (gameState.gems >= 35) {
      spendGems(35);
      addLives(1);
      toast.success("¡Usaste 35 gemas! +1 vida");
      setShowNoLivesModal(false);
    } else {
      toast.error("No tienes suficientes gemas");
    }
  };
  const handleRewardedAdEarned = (gems: number) => {
    toast.success(`¡Ganaste ${gems} gemas! 💎`);
  };
  const handleDirectGoogleSignIn = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await signInWithGoogleNative("select_account");
        return;
      }
      await signInWithGoogleWeb("/", "select_account");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al iniciar sesión con Google");
    }
  };
  const handleAdminAccessTap = useCallback(
    (event?: { preventDefault?: () => void }) => {
      event?.preventDefault?.();
      const now = Date.now();
      const recentTaps = adminTapsRef.current.filter((tap) => now - tap < 3500);
      const nextCount = recentTaps.length + 1;
      adminTapsRef.current = [...recentTaps, now];
      if (nextCount >= 5) {
        adminTapsRef.current = [];
        toast.success("Abriendo panel admin…");
        navigate("/admin?secret=1");
        return;
      }
      if (nextCount >= 3) {
        toast(`Acceso admin ${nextCount}/5`, {
          duration: 900,
        });
      }
    },
    [navigate],
  );
  if (authLoading || gameLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🌸</div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }
  // NO auth wall — guests play immediately!
  if (screen === "game") {
    const restoredProps = restoredGameState
      ? {
          initialMoves: restoredGameState.moves,
          initialScore: restoredGameState.score,
          initialCollected: restoredGameState.collected,
        }
      : {};

    return (
      <GameScreen
        level={currentLevel}
        onWin={(stars, reward) => {
          setRestoredGameState(null);
          handleWin(stars, reward);
        }}
        onLose={(payload) => {
          setRestoredGameState(null);
          handleLose(payload);
        }}
        onBack={() => setScreen("menu")}
        onQuit={() => {
          setRestoredGameState(null);
          handleQuitMidGame();
        }}
        onShowExitModal={() => setShowExitModal(true)}
        consecutiveLossesOnLevel={consecutiveLossesByLevel[currentLevel.id] ?? 0}
        {...restoredProps}
        gems={gameState.gems}
        onSpendGems={spendGems}
        hammers={gameState.hammers}
        shuffles={gameState.shuffles}
        undos={gameState.undos}
        onUseHammer={useHammer}
        onUseShuffle={useShuffle}
        onUseUndo={useUndo}
      />
    );
  }
  if (screen === "customize") {
    return (
      <>
        <CustomizeScreen onBack={() => setScreen("menu")} />
        <ThemeUnlockedModal
          theme={recentUnlockedTheme ? THEME_MAP[recentUnlockedTheme] : null}
          open={!!recentUnlockedTheme}
          onClose={() => setRecentUnlockedTheme(null)}
          onUseNow={() => {
            if (recentUnlockedTheme) setActiveTheme(recentUnlockedTheme);
            setRecentUnlockedTheme(null);
          }}
        />
      </>
    );
  }
  if (screen === "howtoplay") {
    return <HowToPlayScreen onBack={() => setScreen("menu")} />;
  }

  if (screen === "levels") {
    const maxUnlockedLevel = Math.max(1, ...gameState.completedLevels) + 1;
    return (
      <LevelSelect
        unlockedLevels={maxUnlockedLevel}
        completedLevels={gameState.completedLevels}
        onSelectLevel={handleSelectLevel}
        onBack={() => setScreen("menu")}
      />
    );
  }
  // ¿Es usuario nuevo? (menos de 5 niveles completados)
  const isNewUser = gameState.completedLevels.length < 5;
  return (
    <>
    <PurchaseLoadingOverlay />
    <ThemeUnlockedModal
      theme={recentUnlockedTheme ? THEME_MAP[recentUnlockedTheme] : null}
      open={!!recentUnlockedTheme}
      onClose={() => setRecentUnlockedTheme(null)}
      onUseNow={() => {
        if (recentUnlockedTheme) setActiveTheme(recentUnlockedTheme);
        setRecentUnlockedTheme(null);
        setScreen("customize");
      }}
    />
    <div className="min-h-screen px-4 py-6 md:py-10 relative z-10">
      <div className="max-w-md mx-auto flex min-h-[calc(100vh-3rem)] flex-col justify-center">
        {/* User Info & Music Control */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <User className="w-4 h-4" />
            <span className="text-sm">{user ? user.email?.split("@")[0] : "Invitado"}</span>
            {!user && (
              <button
                onClick={() => setShowLoginPrompt("save_progress")}
                className="text-xs text-primary underline ml-1"
              >
                Guardar
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <AudioControls />
            <button
              onClick={() => {
                if (user) {
                  setShowExitModal(true);
                } else {
                  setShowExitModal(true);
                }
              }}
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-destructive/20 border-2 border-destructive/50 hover:bg-destructive/30 active:scale-95 transition-transform duration-100"
              aria-label="Salir del juego"
            >
              <DoorOpen className="w-6 h-6 text-destructive" />
            </button>
          </div>
        </div>
        {/* Compact HUD */}
        <GameHeader
          lives={gameState.lives}
          gems={gameState.gems}
          hasUnlimitedLives={hasUnlimitedLives()}
          timeUntilNextLife={getTimeUntilNextLife()}
          onShopClick={() => {
            trackEvent('shop_opened', { source: 'header_gems' });
            setScreen("shop");
          }}
        />

        {/* Piggy bank (after level 1) */}
        {!isNewUser && (
          <div className="flex justify-end -mt-3 mb-2">
            <PiggyBank
              amount={piggyBank.amount}
              cap={piggyBank.cap}
              onClick={() => {
                trackEvent('piggy_bank_opened', { amount: piggyBank.amount, isFull: piggyBank.isFull });
                setShowPiggyModal(true);
              }}
            />
          </div>
        )}

        {/* Level Map - main content */}
        <div className="mt-2">
          <LevelMap
            currentLevel={gameState.currentLevel}
            completedLevels={gameState.completedLevels}
            starsEarned={gameState.starsEarned}
            onLevelClick={handleSelectLevel}
          />
        </div>

        {/* Secondary actions row */}
        <div className="mt-4 flex flex-col gap-2 pb-6">
          <PersonalizeHeroButton onClick={() => setScreen("customize")} />
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => setScreen("howtoplay")}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              {t("menu.how_to_play")}
            </Button>
            {!user ? (
              <Button
                onClick={handleDirectGoogleSignIn}
                variant="outline"
                size="sm"
                className="w-full"
                aria-label="Continuar con Google"
              >
                <User className="w-4 h-4 mr-1" />
                Google
              </Button>
            ) : (
              <Button
                onClick={() => {
                  trackEvent('shop_opened', { source: 'secondary_button' });
                  setScreen("shop");
                }}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <ShoppingBag className="w-4 h-4 mr-1" />
                {t("menu.shop")}
              </Button>
            )}
          </div>
          {/* Player Rank (after level 5) */}
          {!isNewUser && (
            <div className="mt-2">
              <PlayerRank levelsCompleted={gameState.completedLevels.length} />
            </div>
          )}
        </div>

        {/* Hidden admin access (tap 5 times) */}
        <button
          type="button"
          onPointerUp={handleAdminAccessTap}
          className="fixed bottom-1 left-1 w-10 h-10 opacity-0 z-50"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {/* Side icon column (after level 2) */}
      <SideIconsColumn
        visible={!isNewUser}
        onBattlePass={() => setShowBattlePass(true)}
        onStreak={() => setShowStreakCalendar(true)}
        onMissions={() => setShowDailyMissions(true)}
        onLootChest={() => setShowLootChest(true)}
        onShop={() => {
          trackEvent('shop_opened', { source: 'side_icons' });
          setScreen("shop");
        }}
        streakCount={streakData.currentStreak}
        canClaimStreak={streakData.canClaimToday}
      />

      {/* Corner rewarded ad button */}
      {!isNewUser && (
        <WatchAdCornerButton onClick={() => setShowAdModal(true)} />
      )}

      {/* Rewarded ad modal (bottom sheet) */}
      {showAdModal && (
        <div
          className="fixed inset-0 z-40 bg-black/60 flex items-end"
          onClick={() => setShowAdModal(false)}
        >
          <div
            className="w-full bg-background border-t border-border rounded-t-2xl p-4 max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-lg">Ver anuncio</h3>
              <button
                onClick={() => setShowAdModal(false)}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <RewardedAds
              onRewardEarned={(g) => {
                handleRewardedAdEarned(g);
                setShowAdModal(false);
              }}
              currentLevel={gameState.currentLevel}
            />
          </div>
        </div>
      )}

      {/* Splash (one-shot per session) */}
      <SplashScreen />

      {/* Shop Modal - SIEMPRE ACCESIBLE */}
      {screen === "shop" && (
        <Shop
          onClose={() => setScreen("menu")}
          onPurchase={handlePurchase}
          isNewUser={isNewUser}
          hasPurchasedOnce={hasPurchasedOnce}
        />
      )}
      {/* No Lives Modal */}
      {showNoLivesModal && (
        <NoLivesModal
          gems={gameState.gems}
          onUseGems={handleUseGemsForLife}
          onClose={() => setShowNoLivesModal(false)}
          onUnlimitedLivesPurchased={() => {
            reloadFromDB?.();
            toast.success("¡Vidas Infinitas activadas! 30 minutos ❤️∞");
            setShowNoLivesModal(false);
          }}
          onQuickLifePurchased={handleQuickLifePurchased}
          onShowStarterOffer={() => {
            if (!canShowStarterGems()) return;
            trackEvent('offer_shown', { offer: 'starter_gems', productId: 'starter_gems', product: 'starter_gems', trigger: 'no_lives', source: 'no_lives_no_gems' });
            markStarterGemsShown();
            setTimeout(() => setShowStarterPack(true), 300);
          }}
        />
      )}
      {/* Battle Pass Modal */}
      {showBattlePass && (
        <Suspense fallback={null}>
          <BattlePass
            onClose={() => setShowBattlePass(false)}
            hasPremiumAccess={hasActiveProduct("garden_pass")}
            onPurchaseSuccess={() => {
              reloadFromDB?.();
              toast.success("¡Battle Pass Premium activado!");
            }}
          />
        </Suspense>
      )}
      {/* Daily Streak Calendar Modal */}
      {!autoPopupsBlocked && showStreakCalendar && (
        <DailyStreakCalendar
          onClose={() => setShowStreakCalendar(false)}
          onRewardClaimed={(gems, lives) => {
            addGems(gems);
            addLives(lives);
            toast.success(`¡Racha reclamada! +${gems}💎 +${lives}❤️`);
          }}
        />
      )}
      {/* Review prompt — shown ONCE after completing level 10 */}
      <ReviewPrompt level={lastCompletedLevel} />
      {/* First Day Offer - after level 3 completion (anti-avalanche guarded) */}
      {!autoPopupsBlocked && gameState.completedLevels.length >= 1 && (
        <FirstDayOffer
          levelJustCompleted={lastCompletedLevel}
          onPurchaseSuccess={() => {
            reloadFromDB?.();
            toast.success("¡Mega Pack activado!");
          }}
        />
      )}
      {/* Starter Pack - después de nivel 4 win */}
      {showStarterPack && (
        <Suspense fallback={null}>
          <StarterPack
            levelJustCompleted={lastCompletedLevel}
            onClose={() => { markStarterGemsDismissed(); setShowStarterPack(false); }}
            onPurchaseSuccess={() => {
              reloadFromDB?.();
              toast.success("¡Inicio Mágico activado! +400💎");
            }}
          />
        </Suspense>
      )}
      {/* Lucky Spin orquestado */}
      <LuckySpin 
        isOpen={showLuckySpin} 
        onClose={() => setShowLuckySpin(false)} 
      />
      {/* Tutorial - auto-skip (desactivado) */}
      <Tutorial onComplete={() => console.log("Tutorial completado")} />
      {/* Achievement Modal */}
      {newlyUnlocked && (
        <Suspense fallback={null}>
          <AchievementModal achievement={newlyUnlocked} onClose={clearNewlyUnlocked} />
        </Suspense>
      )}
      {/* Push Notification Prompt - SOLO después de nivel 2 */}
      {!autoPopupsBlocked && !isNewUser && <NotificationPrompt onClose={() => {}} levelsCompleted={gameState.completedLevels.length} blocked={isEngagementShown()} onAttemptShow={tryClaimEngagementSlot} />}
      {/* Come Back Banner orquestado */}
      <ComeBackBanner 
        isOpen={showComeBackBanner}
        daysAway={comebackDays}
        onClose={() => setShowComeBackBanner(false)}
        onClaimReward={handleClaimComeBackReward}
      />

      {/* Review Request orquestado (Lvl 10 + 5 partidas) */}
      <ReviewRequestModal 
        isOpen={showReviewModal} 
        onClose={() => setShowReviewModal(false)} 
      />
      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <Suspense fallback={null}>
          <ExitConfirmModal
            onStay={() => setShowExitModal(false)}
            onExit={() => {
              setShowExitModal(false);
              if (user) signOut();
            }}
            streak={streakData.currentStreak}
          />
        </Suspense>
      )}
      {/* Login Prompt - for guest users needing auth */}
      {showLoginPrompt && (
        <LoginPrompt
          reason={showLoginPrompt}
          onClose={() => setShowLoginPrompt(null)}
          onSuccess={() => {
            setShowLoginPrompt(null);
            toast.success("¡Cuenta creada! Tu progreso se ha guardado en la nube ☁️");
          }}
        />
      )}
      {/* Day 2-3 Unlock Bonus - SOLO después de nivel 2 */}
      {!isNewUser && (
        <Day2UnlockBanner
          streak={streakData.currentStreak}
          onClaimReward={(gems, lives, powerUps) => {
            addGems(gems);
            addLives(lives);
            if (powerUps?.hammers) {
              for (let i = 0; i < powerUps.hammers; i++) {
                addHammer();
              }
              toast.success(
                `¡MEGA REGALO Día ${streakData.currentStreak}! +${gems}💎 +${lives}❤️ +${powerUps.hammers}🔨`,
              );
            } else {
              toast.success(`¡Regalo Día ${streakData.currentStreak} reclamado! +${gems}💎 +${lives}❤️`);
            }
          }}
        />
      )}
      {/* First Win Celebration - OK para nuevos */}
      {showFirstWin && (
        <FirstWinCelebration
          levelsCompleted={gameState.completedLevels.length}
          onClose={() => setShowFirstWin(false)}
        />
      )}
      {/* Welcome Offer - €0.49 SOLO después de nivel 3 derrota */}
      {showWelcomeOffer && !isNewUser && (
        <Suspense fallback={null}>
          <WelcomeOffer
            onPurchase={() => {
              reloadFromDB?.();
              toast.success("¡Pack Bienvenida activado!");
              setShowWelcomeOffer(false);
            }}
            onDismiss={() => setShowWelcomeOffer(false)}
          />
        </Suspense>
      )}
      {/* First Session Reward - SOLO después de nivel 5 */}
      {!isNewUser && showFirstSessionReward && lastCompletedLevel === 5 && (
        <FirstSessionReward
          levelJustCompleted={lastCompletedLevel}
          onClaim={(gems, lives) => {
            addGems(gems);
            addLives(lives);
            toast.success(`¡Bienvenido! +${gems}💎 +${lives}❤️`);
            setShowFirstSessionReward(false);
          }}
          onClose={() => setShowFirstSessionReward(false)}
        />
      )}
      {/* Share Prompt */}
      {!autoPopupsBlocked && !isNewUser && <SharePrompt gamesPlayed={gamesPlayed} daysPlayed={streakData.currentStreak} blocked={isEngagementShown()} onAttemptShow={tryClaimEngagementSlot} />}
      {/* Flash Offer - after 2 consecutive losses */}
      {showFlashOffer && (
        <Suspense fallback={null}>
          <FlashOffer
            trigger="loss"
            onClose={() => {
              setShowFlashOffer(false);
              setConsecutiveLosses(0);
            }}
            onPurchaseSuccess={() => {
              reloadFromDB?.();
              toast.success("¡Pack Relámpago activado!");
            }}
          />
        </Suspense>
      )}
      {/* Post Victory Offer - SOLO después de nivel 2 */}
      {showPostVictoryOffer && lastWinGems > 0 && !isNewUser && (
        <Suspense fallback={null}>
          <PostVictoryOffer
            baseGems={lastWinGems}
            levelId={currentLevel.id}
            onClose={() => setShowPostVictoryOffer(false)}
            onPurchaseSuccess={() => {
              reloadFromDB?.();
              toast.success("¡Bonus de victoria activado!");
            }}
          />
        </Suspense>
      )}
      {/* Daily Missions */}
      {showDailyMissions && (
        <Suspense fallback={null}>
          <DailyMissions
            onClose={() => setShowDailyMissions(false)}
            onRewardClaimed={(gems) => {
              addGems(gems);
              toast.success(`¡Misión completada! +${gems}💎`);
            }}
          />
        </Suspense>
      )}

      {/* Loot Chest */}
      {showLootChest && (
        <Suspense fallback={null}>
          <LootChest
            onClose={() => setShowLootChest(false)}
            onRewardClaimed={(gems, lives) => {
              addGems(gems);
              addLives(lives);
              toast.success(`¡Cofre abierto! +${gems}💎 +${lives}❤️`);
            }}
          />
        </Suspense>
      )}

      {/* Spring Event orquestado */}
      <SpringEvent 
        isOpen={showSpringEvent} 
        onClose={() => {
          setShowSpringEvent(false);
          localStorage.setItem('spring-event-seen', new Date().toDateString());
        }} 
      />
      {/* Payment Success Modal */}
      <Suspense fallback={null}>
        <PaymentSuccessModal
          show={paymentModal.show}
          productName={paymentModal.productName}
          rewardText={paymentModal.rewardText}
          onClose={() => setPaymentModal({ show: false, productName: "", rewardText: "" })}
        />
      </Suspense>
      {/* Force native update modal - blocks entire app if native version is too old */}
      {appUpdate.nativeUpdateRequired && (
        <ForceUpdateModal
          playStoreUrl={appUpdate.playStoreUrl}
          updateMessage={appUpdate.updateMessage}
          currentVersion={appUpdate.currentVersionCode}
          requiredVersion={appUpdate.requiredVersionCode}
        />
      )}

      {/* T5 — Piggy bank modal */}
      <PiggyBankModal
        open={showPiggyModal}
        amount={piggyBank.amount}
        cap={piggyBank.cap}
        onClose={() => setShowPiggyModal(false)}
        onPurchaseSuccess={async () => {
          try {
            const res = await piggyBank.unlock();
            if (res?.gemsGranted) {
              addGems(res.gemsGranted);
              toast.success(`🐷 ¡Hucha desbloqueada! +${res.gemsGranted} 💎`);
            }
          } catch (e) {
            toast.error("Error al desbloquear hucha");
          }
          setShowPiggyModal(false);
        }}
      />

      {/* T9 — Win streak offer */}
      {showWinStreakOffer && (
        <WinStreakOffer
          streakCount={winStreak.count}
          onClose={() => setShowWinStreakOffer(false)}
        />
      )}

      {/* T6 — Daily streak bonus offer (5 / 7 day milestone) */}
      {showStreakBonusOffer && (
        <StreakBonusOffer
          streakDays={showStreakBonusOffer}
          onClose={() => setShowStreakBonusOffer(null)}
        />
      )}

      {/* CAMBIO 2 — Customize intro modal (post-level-1, una sola vez, anti-avalancha) */}
      {showCustomizeIntro && !autoPopupsBlocked && (
        <CustomizeIntroModal
          onAccept={() => {
            try { localStorage.setItem(LS_KEYS.CUSTOMIZE_INTRO_SHOWN, 'true'); } catch {}
            setShowCustomizeIntro(false);
            setScreen("customize");
          }}
          onDismiss={() => {
            try { localStorage.setItem(LS_KEYS.CUSTOMIZE_INTRO_SHOWN, 'true'); } catch {}
            setShowCustomizeIntro(false);
          }}
        />
      )}

      {/* CAMBIO 10 — End-of-session banner (Zeigarnik) */}
      {showEndOfSessionBanner && !autoPopupsBlocked && (
        <EndOfSessionBanner
          piggyAmount={piggyBank.amount}
          piggyCap={piggyBank.cap}
          lives={gameState.lives}
          timeUntilNextLifeSec={getTimeUntilNextLife()}
          currentStreak={streakData.currentStreak}
          onDismiss={() => setShowEndOfSessionBanner(false)}
        />
      )}
    </div>
    </>

  );
};
export default Index;
