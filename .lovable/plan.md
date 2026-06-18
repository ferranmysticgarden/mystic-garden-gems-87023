# Plan: arreglo flujo post-nivel-1 (Mega Pack + CustomizeIntro)

## Decisión: FirstDayOffer al nivel 3 (no nivel 2)
Nivel 2 sigue siendo onboarding muy temprano; nivel 3 ya hay 3 wins (señal de retención D0), coincide con el regalo gratuito de +20 gemas (refuerzo positivo previo a la oferta). Estándar del sector match-3 (King/Playrix) sitúa la primera oferta agresiva entre niveles 3-5.

## Cambios

### 1. `src/components/game/FirstDayOffer.tsx`
- Cambiar trigger: `levelJustCompleted === 1` → `levelJustCompleted === 3`.
- Mantener el fallback de cuenta nueva (<2h) por si llegan al nivel 3 en otro flujo.
- Eliminar el delay 1500ms (queda 0 ms, el padre ya gestiona orden).

### 2. `src/pages/Index.tsx` — montaje de FirstDayOffer (~línea 1234)
- Añadir guarda `!autoPopupsBlocked` al render condicional.
- Mantener `gameState.completedLevels.length >= 1` para no romper fallback de cuenta nueva.

### 3. `src/pages/Index.tsx` — bloque CustomizeIntro (~líneas 580-585)
- Quitar el `setItem(CUSTOMIZE_INTRO_SHOWN, 'true')` de ahí.
- Mantener la condición de disparo (`currentLevel.id === 1 && !flag`).
- Disparar `setShowCustomizeIntro(true)` directamente (sin delay 1200ms — el modal está por encima de la celebración por z-index `z-[110]` y la celebración ya tiene su propia secuencia).

### 4. `src/pages/Index.tsx` — render CustomizeIntroModal (~líneas 1484-1489)
- Envolver con `!autoPopupsBlocked &&`.
- En `onAccept` y `onDismiss`: marcar `LS_KEYS.CUSTOMIZE_INTRO_SHOWN = 'true'` ANTES de cerrar. Así la flag sólo se consume cuando el usuario interactuó con el modal real.

## Archivos modificados
- `src/components/game/FirstDayOffer.tsx`
- `src/pages/Index.tsx`

## Archivos NO tocados (FROZEN respetados)
- `useGooglePlayBilling.ts`
- `DIAGNOSTICO_PAGOS.md`
- `BillingPlugin.java`
- Edge functions de pago

## Comando reset para tu móvil (DevTools → Console del WebView, o vía `chrome://inspect`)
```js
(function(){
  const keys = Object.keys(localStorage);
  const removed = [];
  keys.forEach(k => {
    if (k === 'CUSTOMIZE_INTRO_SHOWN'
        || k.startsWith('first-day-offer-')
        || k.startsWith('first-win-celebrated-')
        || k === 'first_session_reward_claimed') {
      localStorage.removeItem(k);
      removed.push(k);
    }
  });
  console.log('Flags eliminadas:', removed);
})();
```
(El nombre real de `LS_KEYS.CUSTOMIZE_INTRO_SHOWN` lo verifico antes de implementar para que el comando sea literal — ahora mismo el plan asume que la constante existe en `src/constants/localStorageKeys.ts`.)

## Riesgo
Bajo. Cambios sólo en presentación/triggers. Sin cambios en pagos, BD, ni RLS. Sin nuevos eventos de tracking.

## Confirmación necesaria
¿OK con nivel 3 (vs 2)? ¿OK con el resto? Al recibir tu OK implemento y te paso el comando final con el nombre exacto de la clave.
