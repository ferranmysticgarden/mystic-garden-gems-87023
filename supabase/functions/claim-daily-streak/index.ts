import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DailyReward {
  day: number;
  gems: number;
  lives: number;
  noAdsMinutes: number;
  description: string;
}

const DAILY_REWARDS: DailyReward[] = [
  { day: 1, gems: 10, lives: 1, noAdsMinutes: 0, description: '10 💎 + 1 ❤️' },
  { day: 2, gems: 20, lives: 2, noAdsMinutes: 0, description: '20 💎 + 2 ❤️' },
  { day: 3, gems: 30, lives: 2, noAdsMinutes: 30, description: '30 💎 + 2 ❤️ + 30min sin ads' },
  { day: 4, gems: 40, lives: 3, noAdsMinutes: 0, description: '40 💎 + 3 ❤️' },
  { day: 5, gems: 50, lives: 3, noAdsMinutes: 60, description: '50 💎 + 3 ❤️ + 1h sin ads' },
  { day: 6, gems: 75, lives: 4, noAdsMinutes: 0, description: '75 💎 + 4 ❤️' },
  { day: 7, gems: 100, lives: 5, noAdsMinutes: 60, description: '🔥 100 💎 + 5 ❤️ + 1h sin ads' },
];

const getRewardForDay = (streak: number): DailyReward => {
  const dayIndex = ((streak - 1) % 7);
  return DAILY_REWARDS[dayIndex >= 0 ? dayIndex : 0];
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !serviceKey || !anonKey) throw new Error('Missing backend config');

    // Authenticate the user via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized');
    const token = authHeader.replace('Bearer ', '');

    const userResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
    });
    if (!userResp.ok) throw new Error('Unauthorized');
    const userJson = await userResp.json();
    const userId: string | undefined = userJson?.id;
    if (!userId) throw new Error('Unauthorized');

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // Read current progress (service-role bypasses RLS)
    const { data: progress, error: fetchError } = await admin
      .from('game_progress')
      .select('gems, lives, no_ads_until, current_streak, max_streak, last_login_date, streak_claimed_today')
      .eq('user_id', userId)
      .maybeSingle();
    if (fetchError) throw fetchError;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const lastLoginDate: string | null = (progress?.last_login_date as string | null) ?? null;
    const streakClaimedToday: boolean = Boolean(progress?.streak_claimed_today);
    let currentStreak: number = (progress?.current_streak as number | null) ?? 0;

    // Server-side validation of canClaimToday — mirrors useDailyStreak logic
    let canClaim = false;
    if (lastLoginDate === today) {
      canClaim = !streakClaimedToday;
    } else if (lastLoginDate === yesterday) {
      canClaim = true;
      currentStreak += 1;
    } else if (!lastLoginDate) {
      canClaim = true;
      currentStreak = 1;
    } else {
      canClaim = true;
      currentStreak = 1;
    }

    if (!canClaim) {
      return new Response(JSON.stringify({ success: false, error: 'already_claimed_today' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const reward = getRewardForDay(currentStreak > 0 ? currentStreak : 1);

    const currentGems: number = (progress?.gems as number | null) ?? 0;
    const currentLives: number = Math.min(((progress?.lives as number | null) ?? 0) + reward.lives, 10);

    // Extend no_ads_until safely (server-only writable column)
    let noAdsUntil: Date | null = progress?.no_ads_until
      ? new Date(progress.no_ads_until as string)
      : null;
    if (reward.noAdsMinutes > 0) {
      const now = new Date();
      if (!noAdsUntil || noAdsUntil < now) {
        noAdsUntil = new Date(now.getTime() + reward.noAdsMinutes * 60 * 1000);
      } else {
        noAdsUntil = new Date(noAdsUntil.getTime() + reward.noAdsMinutes * 60 * 1000);
      }
    }

    const newMaxStreak = Math.max((progress?.max_streak as number | null) ?? 0, currentStreak);

    const { error: updateError } = await admin
      .from('game_progress')
      .update({
        gems: currentGems + reward.gems,
        lives: currentLives,
        current_streak: currentStreak,
        max_streak: newMaxStreak,
        last_login_date: today,
        streak_claimed_today: true,
        no_ads_until: noAdsUntil ? noAdsUntil.toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        reward,
        currentStreak,
        maxStreak: newMaxStreak,
        noAdsUntil: noAdsUntil ? noAdsUntil.toISOString() : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[claim-daily-streak] ERROR', message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
