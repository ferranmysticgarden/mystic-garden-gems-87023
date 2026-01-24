# 🌸 MYSTIC GARDEN PRO - RESUMEN COMPLETO DEL PROYECTO

**Última actualización:** 24 Enero 2026  
**Versión actual:** 9.2.0 (código 920)

---

## 📱 INFORMACIÓN BÁSICA

| Campo | Valor |
|-------|-------|
| **Nombre** | Mystic Garden Pro |
| **Package ID** | `com.mysticgarden.game` |
| **Plataforma** | Android (Capacitor 7.4.4) |
| **Framework** | React 18 + Vite + TypeScript + Tailwind CSS |
| **Backend** | Lovable Cloud (Supabase) |
| **Pagos** | Stripe |
| **Estado** | ✅ Publicado en Google Play |

---

## 🔐 CREDENCIALES DE FIRMA (MUY IMPORTANTE)

### Keystore Principal (USAR ESTE)
```
📂 Ruta:     D:\keys_upload_new\mystic-upload-key.jks
🔑 Alias:    mystic-garden
🔒 Password: mystic2026
```

### Keystore Backup (por si acaso)
```
📂 Ruta:     D:\BACKUP_MYSTIC_GARDEN_20260114\android\app\mystic-garden-release-key.keystore
🔑 Alias:    mystic-garden
🔒 Password: mystic123
```

---

## 📂 ESTRUCTURA DE CARPETAS IMPORTANTES

```
D:\mystic-garden-gems-87023\              ← PROYECTO PRINCIPAL
├── android\                              ← Proyecto Android (Capacitor)
│   └── app\build\outputs\bundle\release\ ← AAB generado aquí
├── public\
│   ├── app-icon-512.png                  ← Icono de la app
│   ├── feature-graphic-1024x500.png      ← Banner Play Store
│   └── mystic-forest-bg.jpg              ← Fondo del juego
├── src\
│   ├── assets\                           ← Imágenes promocionales
│   │   ├── promo-combo.png
│   │   ├── promo-daily-streak.png
│   │   ├── promo-lucky-spin.png
│   │   └── promo-video-30s.mp4
│   ├── components\
│   │   ├── game\                         ← Componentes del juego (19 archivos)
│   │   ├── effects\                      ← Efectos visuales
│   │   └── ui\                           ← Componentes UI (shadcn)
│   ├── data\
│   │   ├── levels.ts                     ← 50 niveles definidos
│   │   └── products.ts                   ← Productos de la tienda
│   ├── hooks\                            ← 12 hooks personalizados
│   └── locales\                          ← Idiomas (ES, EN, PT)
├── supabase\
│   └── functions\                        ← Edge Functions (5)
├── build-android-aab.cmd                 ← Script de compilación
└── scripts\                              ← Scripts de build auxiliares
```

---

## 🎮 FUNCIONALIDADES DEL JUEGO

### Core Gameplay
| Feature | Descripción | Archivo |
|---------|-------------|---------|
| **Match-3 Puzzle** | Combina 3+ gemas iguales | `Board.tsx`, `Tile.tsx` |
| **50 Niveles** | Dificultad progresiva | `src/data/levels.ts` |
| **Sistema de Vidas** | 5 vidas, regeneran cada 30min | `useGameState.ts` |
| **Power-ups** | Martillo, Shuffle, Undo | `GameScreen.tsx` |
| **Combos x5** | Multiplicadores visuales | `ComboMultiplier.tsx` |

### Sistema de Retención (19 componentes)
| Feature | Descripción | Archivo |
|---------|-------------|---------|
| 🔥 **Racha Diaria** | 7 días de recompensas escaladas | `DailyStreakCalendar.tsx` |
| 📅 **Calendario Visual** | Muestra progreso de racha | `useDailyStreak.ts` |
| 🎰 **Lucky Spin** | Ruleta diaria gratis | `LuckySpin.tsx` |
| 🏆 **Battle Pass** | 5 niveles de rewards | `BattlePass.tsx` |
| 🏅 **11 Logros** | Sistema de achievements | `AchievementModal.tsx` |
| 🔔 **Push Notifications** | Re-engagement automático | `usePushNotifications.ts` |
| 🎁 **Come Back Reward** | Bonus por volver tras 2+ días | `ComeBackBanner.tsx` |
| ⏰ **Streak Reminder** | Banner animado en menú | `StreakReminderBanner.tsx` |
| 📊 **Progression Bar** | Progreso hacia milestone | `ProgressionBar.tsx` |
| ⭐ **Review Request** | Pide reseña en momento óptimo | `ReviewRequestModal.tsx` |
| 🚪 **Exit Confirm** | Modal al salir del juego | `ExitConfirmModal.tsx` |
| 🎉 **First Win** | Celebración primera victoria | `FirstWinCelebration.tsx` |
| 📤 **Share Prompt** | Pide compartir tras 5 partidas | `SharePrompt.tsx` |
| 📆 **Day 2 Unlock** | Rewards especiales día 2-3 | `Day2UnlockBanner.tsx` |
| 🗓️ **Day Counter** | Contador días jugados | `DayCounter.tsx` |
| 📚 **Tutorial** | Onboarding interactivo | `Tutorial.tsx` |
| 🔔 **Notification Prompt** | Pide permisos push | `NotificationPrompt.tsx` |

### Monetización
| Producto | Precio | Contenido | Archivo |
|----------|--------|-----------|---------|
| **Quick Pack** | €0.99 | 3 vidas + 20 gemas | `products.ts` |
| **100 Gemas** | €0.99 | 100 gemas | `products.ts` |
| **300 Gemas** | €3.99 | 300 gemas | `products.ts` |
| **1200 Gemas** | €9.99 | 1200 gemas | `products.ts` |
| **Sin Ads (1 mes)** | €4.99 | 30 días sin anuncios | `products.ts` |
| **Sin Ads (Siempre)** | €9.99 | Permanente | `products.ts` |
| **Garden Pass** | €9.99 | 1000 gemas + 30 días sin ads | `products.ts` |
| **First Day Offer** | €0.99 | 500 gemas + 10 vidas + 24h sin ads | `FirstDayOffer.tsx` |
| **Lose Bundle** | €0.99 | 5 vidas + 50 gemas + 5 moves | `LoseBundle.tsx` |

---

## 🏆 SISTEMA DE LOGROS (11 achievements)

| ID | Icono | Requisito | Recompensa |
|----|-------|-----------|------------|
| first_win | 🏆 | Ganar 1 nivel | 10 💎 |
| level_10 | 🌸 | Completar nivel 10 | 25 💎 |
| level_25 | 🌺 | Completar nivel 25 | 50 💎 |
| level_50 | 👑 | Completar nivel 50 | 100 💎 |
| streak_3 | 🔥 | 3 días de racha | 20 💎 |
| streak_7 | ⚡ | 7 días de racha | 50 💎 |
| streak_14 | 💫 | 14 días de racha | 100 💎 |
| gems_100 | 💎 | Acumular 100 gemas | 25 💎 |
| gems_500 | 💍 | Acumular 500 gemas | 50 💎 |
| stars_10 | ⭐ | Conseguir 10 estrellas | 30 💎 |
| stars_30 | 🌟 | Conseguir 30 estrellas | 75 💎 |

---

## 🔥 SISTEMA DE RACHA DIARIA

| Día | Gemas | Vidas | Sin Ads | Total Semanal |
|-----|-------|-------|---------|---------------|
| 1 | 10 💎 | 1 ❤️ | - | - |
| 2 | 20 💎 | 2 ❤️ | - | - |
| 3 | 30 💎 | 2 ❤️ | 30 min | - |
| 4 | 40 💎 | 3 ❤️ | - | - |
| 5 | 50 💎 | 3 ❤️ | 60 min | - |
| 6 | 75 💎 | 4 ❤️ | - | - |
| **7** | **100 💎** | **5 ❤️** | **60 min** | **325 💎 + 20 ❤️** |

*Si pierdes un día → reinicia desde Día 1*

---

## 🔔 PUSH NOTIFICATIONS

| Tipo | Trigger | Mensaje |
|------|---------|---------|
| `lives_full` | Vidas regeneradas | "❤️ ¡Tus vidas están llenas!" |
| `daily_bonus` | Bonus disponible | "🎁 ¡Tu bonus diario te espera!" |
| `streak_reminder` | 8 PM si no jugó | "🔥 ¡No pierdas tu racha de X días!" |
| `come_back` | 48h sin jugar | "🌸 ¡Te echamos de menos!" |

---

## 🗄️ BASE DE DATOS (Supabase)

### Tablas
| Tabla | Descripción |
|-------|-------------|
| `profiles` | Datos de usuario (email, display_name) |
| `game_progress` | Progreso del juego (nivel, gemas, vidas, rachas) |
| `achievements` | Logros desbloqueados |
| `user_purchases` | Compras realizadas |

### Columnas de game_progress
```sql
- user_id, current_level, completed_levels[]
- gems, lives, last_life_refill
- hammer_count, shuffle_count, undo_count
- current_streak, max_streak, last_login_date, streak_claimed_today
- unlimited_lives_until
```

---

## ⚡ EDGE FUNCTIONS (Backend)

| Función | Descripción |
|---------|-------------|
| `create-payment` | Crea sesión de pago Stripe |
| `handle-stripe-webhook` | Procesa webhooks de Stripe |
| `send-registration-email` | Email de bienvenida |
| `generate-promo-texts` | Genera textos ASO con IA |
| `analyze-video-frames` | Analiza frames de video |

---

## 🛠️ HOOKS PERSONALIZADOS (12)

| Hook | Función |
|------|---------|
| `useAuth` | Autenticación de usuarios |
| `useGameState` | Estado del juego (vidas, gemas, nivel) |
| `useDailyStreak` | Sistema de racha diaria |
| `useAchievements` | Gestión de logros |
| `usePurchases` | Compras y productos |
| `useStripePayment` | Integración con Stripe |
| `usePushNotifications` | Notificaciones push |
| `useAudio` | Efectos de sonido |
| `useLanguage` | Multi-idioma (ES/EN/PT) |
| `useDeepLinks` | Links profundos |
| `useMobile` | Detección móvil |
| `useToast` | Notificaciones UI |

---

## 🚀 COMANDO PARA COMPILAR AAB

```cmd
cd /d "D:\mystic-garden-gems-87023" && git pull && build-android-aab.cmd
```

**Cuando pida contraseña:** `mystic2026`

**AAB generado en:** `android\app\build\outputs\bundle\release\app-release.aab`

---

## 📊 MÉTRICAS GOOGLE PLAY (Enero 2026)

| Métrica | Valor |
|---------|-------|
| Instalaciones totales | 417 |
| Tasa de conversión (CVR) | 12-14% |
| Usuarios activos mensuales | 29 |
| Retención D7 | ~18% |
| **Objetivo D7** | 30%+ |

---

## 📸 ASSETS PROMOCIONALES

| Asset | Ubicación | Uso |
|-------|-----------|-----|
| Icono 512x512 | `public/app-icon-512.png` | Icono de la app |
| Feature Graphic | `public/feature-graphic-1024x500.png` | Banner Play Store |
| Promo Combo | `src/assets/promo-combo.png` | Screenshot |
| Promo Daily Streak | `src/assets/promo-daily-streak.png` | Screenshot |
| Promo Lucky Spin | `src/assets/promo-lucky-spin.png` | Screenshot |
| Video Promo | `src/assets/promo-video-30s.mp4` | Video Play Store |

---

## 📝 TEXTOS PUBLICITARIOS (Límites)

| Campo | Máximo | Emojis |
|-------|--------|--------|
| Título corto (Play Store) | 30 chars | ✅ Sí |
| Título largo | 90 chars | ✅ Sí |
| Descripción corta | 80 chars | ✅ Sí |
| Google Ads - Título | 30 chars | ❌ NO |
| Google Ads - Descripción | 90 chars | ❌ NO |

---

## 🔒 SEGURIDAD

- ✅ RLS activado en todas las tablas
- ✅ Políticas restrictivas (solo tu propio user_id)
- ✅ Autenticación obligatoria
- ✅ Leaked Password Protection configurado
- ✅ Edge Functions protegidas con auth

---

## 📁 BACKUPS

| Backup | Ubicación |
|--------|-----------|
| Proyecto completo | `D:\BACKUP_MYSTIC_GARDEN_20260114\` |
| Keystore backup | `D:\BACKUP_MYSTIC_GARDEN_20260114\android\app\` |
| GitHub | `github.com/ferranmysticgarden/mystic-garden-gems-87023` |

---

## 🌐 URLs

| Tipo | URL |
|------|-----|
| Preview | https://b7778f96-6661-4e96-a891-680abe7f31b6.lovableproject.com |
| Publicado | https://mystic-garden-gems-87023.lovable.app |
| Google Play | (tu enlace de Play Store) |

---

## 📋 CHECKLIST ANTES DE SUBIR A PLAY STORE

- [ ] `git pull` para tener última versión
- [ ] Ejecutar `build-android-aab.cmd`
- [ ] Password: `mystic2026`
- [ ] Verificar versión correcta en output
- [ ] Subir AAB a Play Console
- [ ] Escribir notas de versión
- [ ] Revisar screenshots y descripción
- [ ] Enviar a revisión

---

*Documento generado automáticamente - Mystic Garden Pro v9.2.0*
