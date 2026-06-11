# Plan de Archivos — Monetización Match-3 (11 tareas)

Plan SOLO de archivos. Sin código todavía. Espero tu OK antes de empezar TAREAS 1-4.

## Convenciones globales

- **Multi-idioma**: añadir claves nuevas a `src/locales/{es,en,pt}.json` en cada tarea. No lo repito tarea a tarea.
- **Tracking**: usa `trackEvent` existente (`src/lib/trackEvent.ts`). No se modifica.
- **Cooldowns / flags locales**: nuevo helper `src/utils/offerCooldown.ts` (get/set por `offer_id`, default 24h) usado por TAREAS 1, 8, 11.
- **Catálogo de productos**: añadir nuevos IDs a `src/data/products.ts` y `src/hooks/googlePlayCatalog.ts` (alias en snake_case, según memoria `product-id-normalization`). Productos nuevos: `piggy_bank_unlock`, `streak_bonus_5days`, `streak_bonus_7days`, `season_pass_premium`, `streak_3wins_bonus`. **Tú los das de alta en Play Console** (snake_case, sufijo cuenta `B6GI8NmIPn` en Stripe — memoria `stripe-price-id-account-suffix-validation`).
- **FROZEN respetados**: `BillingPlugin.java`, `useGooglePlayBilling.ts`, `googleAuth.ts`, `useDeepLinks.ts`, `capacitor.config.ts`, edge functions existentes.
- **Migraciones BD**: te paso el SQL ANTES de ejecutar (`piggy_bank`, `season_passes`). Con `GRANT` + RLS + `service_role` (memoria public-schema-grants).

---

## BLOQUE A — TAREAS 1, 2, 3, 4 (impacto rápido)

### Tarea 1 — Countdown timer en ofertas
- **Nuevo**: `src/components/offers/OfferCountdownTimer.tsx` (300s, pulse último minuto, onExpire).
- **Nuevo**: `src/utils/offerCooldown.ts` (markDismissed, isOnCooldown).
- **Editar**: `src/components/game/StarterPack.tsx`, `src/components/NoLivesModal.tsx`, `src/components/game/UltimateRescueOffer.tsx`, `src/components/game/FlashOffer.tsx` (reemplaza su timer 2h por el nuevo de 5min — confirmar contigo si quieres mantener 2h en FlashOffer; **propuesta: dejar FlashOffer tal cual** porque ya tiene timer propio y semántica distinta).

### Tarea 2 — Precio tachado / anchoring
- **Nuevo**: `src/components/offers/DiscountPrice.tsx` (props: originalPrice, currentPrice, discountPct).
- **Nuevo**: `src/data/offerAnchors.ts` (mapa productId → precio "antes").
- **Editar**: `StarterPack.tsx`, `NoLivesModal.tsx`, `UltimateRescueOffer.tsx`, `FlashOffer.tsx` (sustituyen su bloque de precio actual por `<DiscountPrice/>`).

### Tarea 3 — Mini-tablero con fotos en ofertas
- **Nuevo**: `src/components/offers/PhotoTilesPreview.tsx` (4×4 mockup; lee de `tileSkinStore` si hay fotos del usuario, si no usa 6 placeholders).
- **Nuevo**: `src/assets/preview-tiles/` (cara, mascota, paisaje, comida, postre, flor) — generaré 6 imágenes 256×256.
- **Editar**: `StarterPack.tsx`, `NoLivesModal.tsx`, `UltimateRescueOffer.tsx` para insertar el preview encima del CTA.

### Tarea 4 — Review prompt tras nivel 10
- **Nuevo**: `src/components/ReviewPrompt.tsx` (flag `review_prompt_shown_v1`; intent `market://details?id=com.mysticgarden.game`; fallback `https://play.google.com/store/apps/details?id=...`).
- **Editar**: `src/components/effects/LevelCompleteCelebration.tsx` o `src/pages/Index.tsx` (donde se cierra la celebración del nivel 10) — disparo del prompt 1 sola vez.
- **Nota**: NO añado plugin Capacitor In-App Review en este bloque (cambiaría `package.json` + AAB rebuild). Lo dejo como TODO comentado para 2ª iteración si lo pides.

---

## BLOQUE B — TAREAS 5, 6, 8, 9, 11

### Tarea 5 — Piggy Bank
- **Migración SQL**: tabla `public.piggy_bank` (user_id, guest_session_id, current_amount, last_filled_at, times_purchased, timestamps) + GRANT + RLS + trigger updated_at.
- **Nuevo edge function**: `supabase/functions/unlock-piggy-bank/index.ts` (verifica purchase token Google Play vía mismo patrón que `verify-google-purchase`, acredita gems en `game_progress`, resetea hucha).
- **Nuevo**: `src/components/PiggyBank.tsx` (icono HUD).
- **Nuevo**: `src/components/PiggyBankModal.tsx` (modal "ABRIR por 2,99€" cuando llena).
- **Nuevo**: `src/hooks/usePiggyBank.ts` (lee/escribe estado, incrementa al ganar nivel).
- **Editar**: `src/components/GameHeader.tsx` (montar icono), `src/pages/Index.tsx` (hook `onLevelComplete` → `addToPiggyBank(5..10)`).
- **Editar**: `src/data/products.ts`, `googlePlayCatalog.ts` (alta `piggy_bank_unlock`).

### Tarea 6 — Daily login bonus mejorado (días 5 y 7)
- **Nuevo**: `src/components/game/StreakBonusOffer.tsx` (modal post-reclamación con countdown 24h).
- **Editar**: `src/components/game/DailyStreakCalendar.tsx` (al reclamar día 5/7 → set localStorage `streak_bonus_5_unlocked_at`/`_7_`, disparar modal).
- **Editar**: `src/data/products.ts`, `googlePlayCatalog.ts` (alta `streak_bonus_5days`, `streak_bonus_7days`).

### Tarea 8 — Limited units en starter_gems
- **Nuevo**: `src/utils/starterPackUnits.ts` (10 iniciales, -1 cada 6h, cero = permanently_expired flag).
- **Editar**: `StarterPack.tsx`, `NoLivesModal.tsx`, `UltimateRescueOffer.tsx` — mostrar "Solo quedan X" + ocultar oferta si 0.

### Tarea 9 — Victory streak bonus (3 wins)
- **Nuevo**: `src/hooks/useWinStreak.ts` (cuenta wins, reset on loss; persistido localStorage).
- **Nuevo**: `src/components/game/WinStreakOffer.tsx`.
- **Editar**: `src/pages/Index.tsx` (en victoria → `incrementWinStreak()`; en derrota → reset; si `>=3` mostrar modal una vez por racha).
- **Editar**: `src/data/products.ts`, `googlePlayCatalog.ts` (alta `streak_3wins_bonus`).

### Tarea 11 — Promo banner "Personaliza con tus fotos"
- **Nuevo**: `src/components/PhotoFeatureBanner.tsx` (pulsa, X cierra con cooldown 24h, lee `has_customized_at_least_once_v1`).
- **Editar**: `src/utils/tileSkinStore.ts` (marcar flag cuando se sube primera foto) o `src/components/CustomizeScreen.tsx`.
- **Editar**: `src/pages/Index.tsx` (montar banner en pantalla principal cuando no haya otros modals activos — usa `popup-sequencing` existente).

---

## BLOQUE C — TAREA 7 (Battle Pass / Season Pass)

- **Migración SQL**: tabla `public.season_passes` (user_id, season_id, progress_points, is_premium, claimed_free_tiers int[], claimed_premium_tiers int[], expires_at, timestamps) + GRANT + RLS + trigger.
- **Nuevo edge function**: `supabase/functions/unlock-season-pass/index.ts` (verifica purchase `season_pass_premium`, marca is_premium=true, expires_at +30d).
- **Nuevo edge function**: `supabase/functions/claim-season-tier/index.ts` (valida tier y track, añade a claimed_*, acredita gems/power-ups en game_progress).
- **Nuevo**: `src/pages/SeasonPass.tsx` (ruta `/season-pass`).
- **Nuevo**: `src/components/seasonPass/SeasonPassScreen.tsx`.
- **Nuevo**: `src/components/seasonPass/TierRow.tsx` (Free/Premium side-by-side).
- **Nuevo**: `src/components/seasonPass/ProgressBar.tsx` (HUD).
- **Nuevo**: `src/data/seasonPassTiers.ts` (30 tiers × 2 tracks, recompensas).
- **Nuevo**: `src/hooks/useSeasonPass.ts` (lee/escribe estado, suma punto on level complete).
- **Nuevo**: `public/icon-sets/{unicorns,skulls,sports,flowers-premium}/README.md` + 6 placeholders `*.png` (color + emoji por ahora; luego subes tus IA).
- **Editar**: `src/App.tsx` (ruta `/season-pass`), `src/pages/Index.tsx` (hook progress + entrada al menú), `src/data/products.ts`, `googlePlayCatalog.ts`.

---

## BLOQUE D — TAREA 10 (bonus final)

- **Nuevo**: `src/pages/PromoScreenshots.tsx` (6 vistas conmutables por `?shot=1..6`, viewport fijo móvil).
- **Editar**: `src/App.tsx` (ruta `/promo`, sin auth).

---

## Productos nuevos a dar de alta en Google Play (snake_case)

| ID | Precio | Tarea |
|---|---|---|
| `piggy_bank_unlock` | 2,99€ | 5 |
| `streak_bonus_5days` | 3,99€ | 6 |
| `streak_bonus_7days` | 5,99€ | 6 |
| `streak_3wins_bonus` | 1,99€ | 9 |
| `season_pass_premium` | 4,99€ | 7 |

Stripe equivalentes con sufijo `B6GI8NmIPn` cuando los crees.

---

## Dudas antes de arrancar

1. **FlashOffer**: ¿sustituyo su timer 2h por el nuevo de 5min (Tarea 1) o lo dejo tal cual? Mi recomendación: **dejarlo**, ya tiene su propia semántica.
2. **Review In-App plugin Capacitor**: requiere AAB rebuild. ¿Lo dejo como TODO o quieres que añada `@capacitor-community/in-app-review`? Mi recomendación: **TODO**, en bloque B/C añadirlo si quieres.
3. **Piggy Bank guest mode**: ¿la hucha funciona también para invitados (sin user_id) usando `guest_session_id`? Asumo **sí** (consistente con guest monetization arquitectura).

OK con esto y ataco BLOQUE A.