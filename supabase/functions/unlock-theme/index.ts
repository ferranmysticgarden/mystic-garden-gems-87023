import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FREE_THEME_LEVELS: Record<string, number> = {
  animals: 5,
  desserts: 10,
  fruits: 15,
};

const PREMIUM_THEME_PRODUCTS: Record<string, string> = {
  racing: 'theme_racing_unlock',
  pirates: 'theme_pirates_unlock',
  unicorns: 'theme_unicorns_unlock',
  manga: 'theme_manga_unlock',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !serviceKey || !anonKey) throw new Error('Missing backend config');

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const body = await req.json();
    const { themeId, method, guestSessionId, purchaseRef } = body as {
      themeId: string;
      method: 'level' | 'gems' | 'purchase';
      guestSessionId?: string;
      purchaseRef?: string;
    };

    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
      });
      if (response.ok) {
        const user = await response.json();
        userId = user?.id ?? null;
      }
    }

    if (!userId && !guestSessionId) throw new Error('userId or guestSessionId is required');
    const ownerCol = userId ? 'user_id' : 'guest_session_id';
    const ownerVal = userId ?? guestSessionId!;

    const { data: existing, error: existingError } = await admin
      .from('user_themes')
      .select('id')
      .eq(ownerCol, ownerVal)
      .eq('theme_id', themeId)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      return new Response(JSON.stringify({ success: true, alreadyUnlocked: true, themeId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'level') {
      const requiredLevel = FREE_THEME_LEVELS[themeId];
      if (!requiredLevel) throw new Error('Theme is not level unlockable');
      if (userId) {
        const { data: progress, error } = await admin.from('game_progress').select('current_level').eq('user_id', userId).maybeSingle();
        if (error) throw error;
        if ((progress?.current_level ?? 1) < requiredLevel) throw new Error('Insufficient level');
      }
    }

    if (method === 'gems') {
      if (!userId) throw new Error('Gems unlock requires authenticated user');
      const { data: progress, error } = await admin.from('game_progress').select('gems').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      const currentGems = progress?.gems ?? 0;
      if (currentGems < 450) throw new Error('Not enough gems');
      const { error: updateError } = await admin.from('game_progress').update({ gems: currentGems - 450, updated_at: new Date().toISOString() }).eq('user_id', userId);
      if (updateError) throw updateError;
    }

    if (method === 'purchase') {
      const productId = PREMIUM_THEME_PRODUCTS[themeId];
      if (!productId) throw new Error('Theme is not purchasable');
      if (userId) {
        const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const { data: purchases, error } = await admin
          .from('user_purchases')
          .select('id')
          .eq('user_id', userId)
          .in('product_id', [productId, `stripe_${productId}`, `gp_${productId}`])
          .gte('created_at', tenMinAgo)
          .limit(1);
        if (error) throw error;
        if (!purchases?.length) throw new Error('No recent theme purchase found');
      }
    }

    const insertRow: Record<string, unknown> = {
      theme_id: themeId,
      unlocked_method: method,
      level_at_unlock: method === 'level' ? FREE_THEME_LEVELS[themeId] ?? null : null,
    };
    if (userId) insertRow.user_id = userId;
    else insertRow.guest_session_id = guestSessionId;

    const { error: insertError } = await admin.from('user_themes').insert(insertRow);
    if (insertError) throw insertError;

    if (purchaseRef) {
      await admin.from('processed_webhook_events').insert({
        id: `theme_unlock_${themeId}_${purchaseRef}`,
        user_id: userId,
        product_id: PREMIUM_THEME_PRODUCTS[themeId] ?? themeId,
      });
    }

    return new Response(JSON.stringify({ success: true, themeId, method }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[unlock-theme] ERROR', message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
