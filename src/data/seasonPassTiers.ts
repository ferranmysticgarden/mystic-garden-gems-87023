// Client mirror of server-side tier definitions in
// supabase/functions/claim-season-tier/index.ts. Keep in sync.
// Server is the source of truth; client values are for UI display only.

export interface TierReward {
  gems?: number;
  lives?: number;
  powerups?: number;
}

export interface SeasonTier {
  id: number;
  requiredPoints: number;
  freeReward: TierReward;
  premiumReward: TierReward;
}

export const SEASON_TIERS: SeasonTier[] = [
  { id: 1, requiredPoints: 100, freeReward: { gems: 20 }, premiumReward: { gems: 50, lives: 2 } },
  { id: 2, requiredPoints: 250, freeReward: { lives: 1 }, premiumReward: { gems: 100, powerups: 2 } },
  { id: 3, requiredPoints: 500, freeReward: { gems: 30 }, premiumReward: { gems: 150, lives: 3 } },
  { id: 4, requiredPoints: 800, freeReward: { powerups: 1 }, premiumReward: { gems: 200, lives: 5 } },
  { id: 5, requiredPoints: 1200, freeReward: { gems: 50 }, premiumReward: { gems: 300, lives: 5, powerups: 3 } },
  { id: 6, requiredPoints: 1700, freeReward: { lives: 2 }, premiumReward: { gems: 400, powerups: 5 } },
  { id: 7, requiredPoints: 2300, freeReward: { gems: 75 }, premiumReward: { gems: 500, lives: 10 } },
  { id: 8, requiredPoints: 3000, freeReward: { powerups: 2 }, premiumReward: { gems: 600, lives: 10, powerups: 5 } },
  { id: 9, requiredPoints: 4000, freeReward: { gems: 100 }, premiumReward: { gems: 800, lives: 15 } },
  { id: 10, requiredPoints: 5500, freeReward: { lives: 5 }, premiumReward: { gems: 1500, lives: 25, powerups: 10 } },
];

export const CURRENT_SEASON_ID = "season_2026_summer";
