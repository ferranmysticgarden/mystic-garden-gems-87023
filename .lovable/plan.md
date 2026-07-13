# Plan — 3 features en una pasada

## FEATURE 1 — Racing/Pirates/Unicorns/Manga gratis por nivel

**`src/data/themes.ts`**
- En `THEME_LEVEL_UNLOCKS`: añadir `racing: 20, pirates: 35, unicorns: 50, manga: 65`.
- En los 4 objetos de `THEMES`: cambiar `tier: 'premium'` → `tier: 'free'`, añadir `unlockLevel: 20/35/50/65`, eliminar `gemPrice`, `eurPrice`, `productId` (o mantener `productId` interno comentado; user pidió "productos IAP siguen en products.ts sin mostrarse" → basta con no exponerlos aquí).
- `PREMIUM_THEME_IDS` → vaciar `[]` (referenciado sólo por lógica de visualización premium; se conserva export para compatibilidad).

**`src/components/themes/ThemeCard.tsx`**
- Rama premium (líneas 52-60): eliminar. Rama fallback locked: mostrar `"themes.unlock_at_level" + theme.unlockLevel` en botón deshabilitado.
- Texto info (línea 27-29): ya cubre `unlockLevel`; verificar orden `unlockLevel` antes de `premium`.

**`src/hooks/useUserThemes.ts`**
- `maybeAutoUnlockByLevel` ya funciona genéricamente sobre `THEME_LEVEL_UNLOCKS`. Al ampliar el mapa, auto-unlock funciona sin cambios.

**`src/components/CustomizeScreen.tsx`**
- Verificar props pasadas a `ThemeCard` — quitar handlers premium si sólo se usaban para racing/pirates/unicorns/manga; los props quedan opcionales, no rompe.

## FEATURE 2 — Halloween (nivel 80) y Navidad (nivel 100)

**Assets (12 PNGs, `imagegen` tier standard, 512×512 transparente — el mínimo del generador es 512, no 256; se sirven escalados como los otros temas)**
- `public/themes/halloween/icon_1..6.png`: calabaza, murciélago, fantasma, tumba, luna llena, poción púrpura. Estilo Pixar/3D, paleta púrpura/naranja/negro.
- `public/themes/christmas/icon_1..6.png`: reno, muñeco de nieve, regalo, campana dorada, muérdago, estrella. Estilo Pixar/3D, paleta rojo/verde/dorado/blanco.

**`src/data/themes.ts`**
- `ThemeId`: añadir `'halloween' | 'christmas'`.
- Nuevos objetos en `THEMES` con `tier: 'free'`, `unlockLevel: 80/100`, `iconPaths`.
- `THEME_LEVEL_UNLOCKS`: `halloween: 80, christmas: 100`.
- `THEME_TILE_MAP`: entradas paralelas a los otros.
- Nuevo export `SURPRISE_THEME_IDS: ThemeId[] = ['halloween', 'christmas']`.

**`src/locales/{es,en,pt}.json`**
- `themes.halloween.name`, `themes.christmas.name`, `themes.surprise_title` ("¡TEMA SORPRESA!" / "SURPRISE THEME!" / "TEMA SURPRESA!").

**`src/components/themes/ThemeUnlockedModal.tsx`**
- Detectar `SURPRISE_THEME_IDS.includes(theme.id)`: título → `themes.surprise_title`, header emoji distinto (🎉🎁), estilo con borde dorado/animación.

**`src/components/themes/ThemeCard.tsx`**
- Si `!unlocked && SURPRISE_THEME_IDS.includes(theme.id)`: sustituir grid de iconos por 6 "?" grandes (bloquea preview del tema sorpresa).

## FEATURE 3 — Eventos temporales

**`src/data/events.ts` (nuevo)**
- Tipos: `EventType = 'double_gems' | 'fairy_week'`, `GameEvent = { id, type, startsAt: Date, endsAt: Date, nameKey, descKey, multiplier, icon }`.
- Helpers:
  - `getCurrentEvent(now = new Date()): GameEvent | null` — recorre lista + auto-generación de "double_gems" para el fin de semana actual (Fri 00:00 – Sun 23:59 local).
  - `getRewardMultiplier(now?): number` — devuelve `multiplier` del evento activo o 1.
- Lista `MANUAL_EVENTS` con ejemplos de "fairy_week" (comentado listo para activar).

**`src/pages/Index.tsx`**
- En `handleWin`: `const boosted = { ...reward, gems: Math.round((reward.gems ?? 0) * getRewardMultiplier()) };` → pasar `boosted` a `completeLevel` y a `toast`. Tracking `event_reward_boosted` cuando `multiplier > 1`.
- Renderizar `<EventBanner />` encima del mapa (dentro del bloque `screen === 'menu'`).

**`src/components/game/EventBanner.tsx` (nuevo)**
- `useEffect` cada 60s para recomputar countdown; muestra icono + nombre + "Termina en HH:MM:SS".
- `useEffect` mount → tracking `event_active_shown` una vez por sesión + evento id (localStorage `event_shown_<id>`).

**`src/locales/{es,en,pt}.json`**
- `events.double_gems.name/desc`, `events.fairy_week.name/desc`, `events.ends_in`.

## Verificación final
- `rg -n "'premium'" src/data/themes.ts` → 0 hits.
- `rg -n "halloween|christmas" src/data/themes.ts src/locales/` → presentes.
- `rg -n "getRewardMultiplier|EventBanner" src/` → aplicado en handleWin + render.
- FROZEN intactos: no se tocan `BillingPlugin.java`, `useGooglePlayBilling.ts`, `googleAuth.ts`, `useDeepLinks.ts`, `capacitor.config.ts`, `AndroidManifest.xml`, edge functions de pago ni `DIAGNOSTICO_PAGOS.md`.
- Publicar OTA.

## Notas
- `products.ts` (IAP de temas) queda intacto — no se muestra en UI, mantiene compatibilidad si algún flujo antiguo lo referencia.
- Los 4 temas ex-premium desbloqueados por compra previa siguen desbloqueados (unlock_method en DB no se toca).
- Assets generados a 512×512 (mínimo del generador imagegen), no 256 — se sirven escalados igual que animals/desserts/fruits.
