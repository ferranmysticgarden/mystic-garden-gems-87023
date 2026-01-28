# 💰 ESTADO DEL ROADMAP DE MONETIZACIÓN PSICOLÓGICA

**Última actualización:** 28 Enero 2026  
**Versión:** 9.5.0 → 9.6.0

---

## ✅ COMPLETADO - TOP 5 FÁCILES

### 1. Mensajes Emocionales en Derrota Cercana
- **Archivo:** `src/components/game/CloseDefeatOffer.tsx`
- **Cambio:** Mensajes dinámicos según proximidad a victoria
  - "¡A 1 movimiento de lograrlo!" 
  - "¡A 2 movimientos del éxito!"
  - "¡Tan cerca! Solo te faltaban X movimientos"

### 2. Límite de Anuncios (3/hora)
- **Archivo:** `src/hooks/useAdLimit.ts` (NUEVO)
- **Cambio:** Hook que limita a 3 anuncios por hora
- **Integración:** `src/components/game/RewardedAds.tsx`
- **Resultado:** Muestra contador "X/3 anuncios disponibles" y tiempo de espera

### 3. Giro Extra de Ruleta (€0.49)
- **Archivo:** `src/components/game/LuckySpin.tsx`
- **Cambio:** Después del giro gratis diario, aparece oferta de giro extra pagado
- **Stripe Price ID:** `price_1Stp3dB6GI8NmIPnUvE2TeHL`

### 4. Protección de Racha (€0.49)
- **Archivo:** `src/components/game/StreakProtectionOffer.tsx` (NUEVO)
- **Cambio:** Modal emocional cuando la racha está en peligro
- **Stripe Price ID:** `price_1Stp3sB6GI8NmIPnX6qHHkW0`
- **Características:**
  - Icono de llama animado con contador de días
  - Mensaje dinámico según días de racha
  - Ofrece +24 horas para reclamar bonus

### 5. Pack Salvavidas (€0.49)
- **Archivo:** `src/components/game/LifesaverPack.tsx` (NUEVO)
- **Cambio:** Oferta cuando se queda sin vidas
- **Stripe Price ID:** `price_1Stp48B6GI8NmIPnqyYtX01T`
- **Contenido:** 1 vida + 3 movimientos extra

---

## ✅ COMPLETADO - NUEVO (28 Enero 2026)

### 6. Duplicar Recompensa Post-Victoria (€0.49) ✅
- **Archivo:** `src/components/game/RewardDoubler.tsx` (NUEVO)
- **Stripe Price ID:** `price_1SugszB6GI8NmIPn1huYdoVq`
- **Características:**
  - Modal con temporizador 8 segundos (urgencia)
  - Visual de cofres x2 animados
  - Efecto confetti al entrar
  - Pulsación roja los últimos 3 segundos

### 7. Packs de Experiencia en Tienda ✅
- **Archivo:** `src/components/Shop.tsx` (actualizado)
- **Pack Victoria Segura (€2.99):**
  - Stripe Price ID: `price_1SugtDB6GI8NmIPnFsLC42S1`
  - +5 movimientos, +3 boosters, protección derrota 1x
- **Pack Racha Infinita (€1.99):**
  - Stripe Price ID: `price_1SugtpB6GI8NmIPnrIvDwnsV`
  - Protección racha, +2 vidas, 1 giro extra

---

## 🔄 PENDIENTE - INTEGRACIÓN

### Integrar RewardDoubler en flujo de victoria
- **Estado:** 🟡 Componente listo, pendiente integrar en GameScreen
- **Trigger:** Después de completar nivel exitosamente

### 8. Multiplicador de Combo Pagado
- **Estado:** ❌ No implementado
- **Descripción:** Pagar para mantener multiplicador de combo activo

---

## 🎯 PENDIENTE - LARGO PLAZO (Alto Esfuerzo)

### 9. Jardín Visual Progresivo
- **Estado:** ❌ No implementado
- **Descripción:** Flores/plantas que crecen con progreso
- **Esfuerzo:** Alto (requiere assets y lógica compleja)

### 10. Flores Marchitas (Penalización por Abandono)
- **Estado:** ❌ No implementado
- **Descripción:** Si no juegas, tu jardín se marchita
- **Esfuerzo:** Alto

### 11. Sistema de Mascotas/Decoraciones
- **Estado:** ❌ No implementado
- **Descripción:** Mascotas coleccionables que dan bonuses
- **Esfuerzo:** Muy alto

---

## 📦 PRODUCTOS STRIPE ACTUALES

| Product ID | Precio | Stripe Price ID |
|------------|--------|-----------------|
| `gems_100` | €0.99 | `price_1SOlx6FOm1x8pT7SJ8TaPGpp` |
| `gems_300` | €3.99 | `price_1SOlxOFOm1x8pT7SLLhpmfjo` |
| `gems_1200` | €9.99 | `price_1SOlxcFOm1x8pT7Su2qVAVIY` |
| `no_ads_month` | €4.99 | `price_1SOlxtFOm1x8pT7SqKoeeYTq` |
| `no_ads_forever` | €9.99 | `price_1SOly7FOm1x8pT7SypwYMFz9` |
| `garden_pass` | €9.99 | `price_1SOlyNFOm1x8pT7SzEKZMpYY` |
| `quick_pack` | €0.99 | `price_1SnbakB6GI8NmIPnVmGc39IK` |
| `mega_pack_inicial` | €0.99 | `price_1Spc1wB6GI8NmIPnsUGlPqoR` |
| `pack_revancha` | €0.99 | `price_1Spc2AB6GI8NmIPnKpsekI9G` |
| `victory_multiplier` | €0.99 | `price_1StWrVB6GI8NmIPnn88ftQMe` |
| `finish_level` | €0.99 | `price_1StbMWB6GI8NmIPn9BMYkgrR` |
| `starter_pack` | €0.99 | `price_1StceHB6GI8NmIPn2RGJWhAA` |
| `continue_game` | €0.99 | `price_1StcfKB6GI8NmIPnUYIOAmai` |
| `buy_moves` | €0.99 | `price_1StcfiB6GI8NmIPntLwsg80l` |
| `flash_offer` | €0.99 | `price_1StWrVB6GI8NmIPnn88ftQMe` |
| `extra_spin` | €0.49 | `price_1Stp3dB6GI8NmIPnUvE2TeHL` |
| `streak_protection` | €0.49 | `price_1Stp3sB6GI8NmIPnX6qHHkW0` |
| `lifesaver_pack` | €0.49 | `price_1Stp48B6GI8NmIPnqyYtX01T` |

---

## 📝 NOTAS IMPORTANTES

1. **Edge Function actualizada:** `create-payment` ya tiene todos los price IDs
2. **Hook useAdLimit:** Usa localStorage para persistir contador de anuncios
3. **Componentes nuevos:** 
   - `StreakProtectionOffer.tsx`
   - `LifesaverPack.tsx`
4. **Pendiente integrar:** Los nuevos componentes en el flujo del juego (GameScreen, etc.)

---

## 🚀 PRÓXIMOS PASOS RECOMENDADOS

1. Integrar `StreakProtectionOffer` en `DailyStreakCalendar.tsx`
2. Integrar `LifesaverPack` en `NoLivesModal.tsx`
3. Implementar duplicador de recompensa post-victoria
4. Crear packs de experiencia en la tienda
5. Actualizar versión a 9.5.0 y generar AAB

---

*Documento de referencia para el roadmap de monetización - Mystic Garden Pro*
