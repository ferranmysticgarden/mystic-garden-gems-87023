// Central registry of localStorage keys used across monetization features.
// Add new keys here so we can audit and clear them in one place.

export const LS_KEYS = {
  // T4 Review prompt
  REVIEW_PROMPT_SHOWN: "review_prompt_shown_v1",

  // T5 Piggy bank (guest fallback)
  PIGGY_BANK_GUEST_STATE: "piggy_bank_guest_state_v1",
  PIGGY_BANK_LAST_DEPOSIT_AT: "piggy_bank_last_deposit_at_v1",

  // T6 Daily streak bonus offers
  STREAK_BONUS_5_LAST_SHOWN: "streak_bonus_5_last_shown_v1",
  STREAK_BONUS_7_LAST_SHOWN: "streak_bonus_7_last_shown_v1",

  // T7 Season pass
  SEASON_PASS_GUEST_STATE: "season_pass_guest_state_v1",
  SEASON_PASS_CURRENT_ID: "season_pass_current_id",

  // T8 Limited starter pack units
  STARTER_PACK_UNITS_REMAINING: "starter_pack_units_remaining_v1",
  STARTER_PACK_UNITS_LAST_TICK: "starter_pack_units_last_tick_v1",

  // T9 Victory streak
  WIN_STREAK_COUNT: "win_streak_count_v1",
  WIN_STREAK_LAST_WIN_AT: "win_streak_last_win_at_v1",
  WIN_STREAK_OFFER_LAST_SHOWN: "win_streak_offer_last_shown_v1",

  // T11 Photo feature banner
  PHOTO_FEATURE_BANNER_DISMISSED: "photo_feature_banner_dismissed_v1",

  // V2026-10 batch
  CUSTOMIZE_INTRO_SHOWN: "customize_intro_shown_v1",
  WIN_STREAK_POWERUP_PENDING: "win_streak_powerup_pending_v1",
  WIN_STREAK_POWERUP_COUNT: "win_streak_powerup_count_v1",
  LAST_ENTERED_LEVEL_SESSION: "last_entered_level_session_v1",
  END_OF_SESSION_BANNER_DISMISSED: "end_of_session_banner_dismissed_session",

  // Existing (do not re-create)
  GUEST_SESSION_ID: "guest_session_id",
} as const;

export type LSKey = (typeof LS_KEYS)[keyof typeof LS_KEYS];
