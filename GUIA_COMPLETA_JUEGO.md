# 🌸 MYSTIC GARDEN PRO - GUÍA COMPLETA DEL JUEGO

**Versión actual:** 9.2.2 (código 922)  
**Última actualización:** 24 Enero 2026  
**Estado Google Play:** En revisión (normalmente 24-72 horas, a veces menos)

---

## 📱 INFORMACIÓN BÁSICA

| Campo | Valor |
|-------|-------|
| **Nombre** | Mystic Garden Pro |
| **Package ID** | `com.mysticgarden.game` |
| **Plataforma** | Android (Capacitor) + Web |
| **Frameworks** | React, Vite, TypeScript, Tailwind CSS |
| **Backend** | Supabase (Lovable Cloud) |
| **Pagos** | Stripe |
| **Anuncios** | AdMob (real) |

---

## 🔑 UBICACIÓN DE CLAVES Y CREDENCIALES

### Keystore para firmar APK/AAB
```
📁 Keystore Principal: D:\keys_upload_new\mystic-upload-key.jks
   - Alias: mystic-garden
   - Contraseña: mystic2026

📁 Keystore Backup: D:\BACKUP_MYSTIC_GARDEN_20260114\android\app\mystic-garden-release-key.keystore
   - Alias: mystic-garden
   - Contraseña: mystic123
```

### Proyecto Local
```
📁 Proyecto: D:\mystic-garden-gems-87023
📁 AAB generado: D:\mystic-garden-gems-87023\android\app\build\outputs\bundle\release\app-release.aab
```

### Comando para compilar
```cmd
cd /d "D:\mystic-garden-gems-87023"
git pull origin main
.\build-android-aab.cmd
REM Contraseña: mystic2026
```

---

## 🎮 GAMEPLAY - MECÁNICAS CORE

### Tipo de Juego
**Match-3 Puzzle** - Combina 3 o más fichas iguales para eliminarlas

### Tablero
- **Tamaño:** 8x8 celdas
- **Fichas:** 🌸 🌺 🌼 🍃 🌻 🌷
- **Archivo:** `src/components/Board.tsx`

### Sistema de Vidas
- **Máximo:** 5 vidas
- **Recarga:** 1 vida cada 25 minutos
- **Vidas ilimitadas:** Disponible temporalmente vía compras/recompensas
- **Archivo:** `src/hooks/useGameState.ts`

### Power-ups Disponibles
| Power-up | Función | Archivo |
|----------|---------|---------|
| 🔨 Martillo | Elimina 1 ficha | `useGameState.ts` |
| 🔀 Shuffle | Reorganiza el tablero | `useGameState.ts` |
| ↩️ Undo | Deshace el último movimiento | `useGameState.ts` |

---

## 📊 NIVELES (50 TOTAL)

### Estructura de niveles
**Archivo:** `src/data/levels.ts`

### Tipos de objetivos
1. **Score** - Alcanzar X puntos
2. **Collect** - Recolectar X fichas de un tipo

### Distribución de dificultad

| Niveles | Dificultad | Movimientos | Descripción |
|---------|------------|-------------|-------------|
| 1-10 | MUY FÁCIL | 25-30 | Para enganchar jugadores nuevos |
| 11-20 | FÁCIL | 20-25 | Aumenta ligeramente |
| 21-30 | MEDIA | 22-25 | Desafío moderado |
| 31-40 | DIFÍCIL | 22-25 | Objetivos más altos |
| 41-50 | MUY DIFÍCIL | 22-30 | Máximo desafío |

### Recompensas por niveles
| Nivel | Gemas de recompensa |
|-------|---------------------|
| 5 | 5 💎 |
| 10 | 10 💎 |
| 15 | 15 💎 |
| 20 | 20 💎 |
| 25 | 25 💎 |
| 30 | 30 💎 |
| 35 | 35 💎 |
| 40 | 40 💎 |
| 45 | 45 💎 |
| 50 | 50 💎 |

---

## 🔊 SISTEMA DE AUDIO

### Estado Actual
⚠️ **El juego tiene preparado el sistema de audio pero la música de fondo requiere archivo externo**

### Música de fondo (useAudio.ts)
- **Archivo esperado:** `public/audio/background-music.mp3` (NO EXISTE ACTUALMENTE)
- **Funcionalidad:** Loop, volumen 50%, play/pause/mute
- **Archivo:** `src/hooks/useAudio.ts`

### Efectos de sonido (Web Audio API)
Los efectos están sintetizados con Web Audio API (no requieren archivos):
- ✅ Selección de gema (sine pop)
- ✅ Intercambio de gemas
- ✅ Match exitoso (pitch dinámico)
- ✅ Movimiento inválido (buzz)
- ✅ Explosión de gemas
- ✅ Victoria (aplausos, fuegos artificiales)
- ✅ Derrota (tonos descendentes)
- ✅ Combos (acordes ascendentes)

### ⚠️ PENDIENTE
```
❌ Falta archivo: public/audio/background-music.mp3
   → El botón de música existe pero no hay archivo de audio
```

---

## 💰 MONETIZACIÓN

### Productos en Tienda (Stripe)
**Archivo:** `src/data/products.ts`

| ID | Producto | Precio | Contenido |
|----|----------|--------|-----------|
| `quick_pack` | Quick Pack | €0.99 | 3 vidas + 20 gemas |
| `gems_100` | 100 Gemas | €0.99 | 100 💎 |
| `gems_300` | 300 Gemas | €3.99 | 300 💎 |
| `gems_1200` | 1200 Gemas | €9.99 | 1200 💎 |
| `no_ads_month` | Sin Anuncios (1 mes) | €4.99 | 30 días sin ads |
| `no_ads_forever` | Sin Anuncios (Siempre) | €9.99 | Permanente |
| `garden_pass` | Pase de Jardín | €9.99 | 1000 💎 + 30 días sin ads |

### Ofertas Especiales
| Componente | Trigger | Precio | Contenido |
|------------|---------|--------|-----------|
| `FirstDayOffer.tsx` | Primeras 24h | €0.99 | 500💎 + 10❤️ + 24h sin ads |
| `LoseBundle.tsx` | Al perder nivel | €0.99 | 5❤️ + 50💎 + 5 movimientos extra |

### Anuncios (AdMob)
- **Estado:** Configurado con AdMob real
- **Recompensa:** 20 gemas por video visto
- **Archivo:** `src/components/game/RewardedAds.tsx`

---

## 🏆 LOGROS (11 TOTAL)

**Archivo:** `src/types/achievements.ts`

| ID | Nombre | Requisito | Recompensa |
|----|--------|-----------|------------|
| `first_win` | 🏆 Primera Victoria | Completar 1 nivel | 10 💎 |
| `level_10` | 🌸 Maestro del Jardín | Completar 10 niveles | 25 💎 |
| `level_25` | 🌺 Experto en Flores | Completar 25 niveles | 50 💎 |
| `level_50` | 👑 Leyenda del Jardín | Completar 50 niveles | 100 💎 |
| `streak_3` | 🔥 Racha de 3 | 3 días consecutivos | 20 💎 |
| `streak_7` | ⚡ Racha Semanal | 7 días consecutivos | 50 💎 |
| `streak_14` | 💫 Racha Legendaria | 14 días consecutivos | 100 💎 |
| `gems_100` | 💎 Coleccionista | Acumular 100 gemas | 25 💎 |
| `gems_500` | 💍 Cazador de Tesoros | Acumular 500 gemas | 50 💎 |
| `stars_10` | ⭐ Perfeccionista | 10 victorias con 3 estrellas | 30 💎 |
| `stars_30` | 🌟 Maestro Perfecto | 30 victorias con 3 estrellas | 75 💎 |

---

## 📅 SISTEMA DE RACHA DIARIA

**Archivo:** `src/hooks/useDailyStreak.ts`

### Recompensas por día consecutivo
| Día | Gemas | Vidas | Bonus |
|-----|-------|-------|-------|
| 1 | 10 💎 | 1 ❤️ | - |
| 2 | 20 💎 | 2 ❤️ | - |
| 3 | 30 💎 | 2 ❤️ | 30 min sin ads |
| 4 | 40 💎 | 3 ❤️ | - |
| 5 | 50 💎 | 3 ❤️ | 1h sin ads |
| 6 | 75 💎 | 4 ❤️ | - |
| 7 | 100 💎 | 5 ❤️ | 1h sin ads |

⚠️ **Si pierdes un día, la racha se reinicia a 0**

---

## 🎰 SISTEMAS DE ENGAGEMENT

### Lucky Spin (Ruleta diaria)
- **Archivo:** `src/components/game/LuckySpin.tsx`
- **Frecuencia:** 1 vez al día
- **Premios:** Gemas aleatorias
- **Efectos:** Sonidos, confetti, animaciones

### Battle Pass (5 niveles)
- **Archivo:** `src/components/game/BattlePass.tsx`
- **Desbloqueo:** Cada 10 niveles completados
- **Estado:** 100% gratis (sin versión premium actualmente)
- **Recompensas:** Gemas progresivas

### Combo Multiplier
- **Archivo:** `src/components/game/ComboMultiplier.tsx`
- **3+ cascada:** x2 "GENIAL!"
- **5+ cascada:** x3 "INCREÍBLE!"
- **7+ cascada:** x4 "ESPECTACULAR!"

### Barra de Progresión
- **Archivo:** `src/components/game/ProgressionBar.tsx`
- **Muestra:** Progreso hacia próximo milestone (10, 20, 30...)

---

## 🔔 NOTIFICACIONES PUSH

**Archivo:** `src/hooks/usePushNotifications.ts`

| Tipo | Trigger | Mensaje |
|------|---------|---------|
| Vidas llenas | 5 vidas regeneradas | "¡Tus vidas están llenas!" |
| Recordatorio racha | 6PM si no jugó hoy | "¡No pierdas tu racha!" |
| Vuelve a jugar | 2+ días ausente | "¡Tu jardín te extraña!" |

---

## 🎨 TEMA VISUAL

### Estilo
- **Tema:** Bosque místico encantado
- **Background:** `public/mystic-forest-bg.jpg`
- **Paleta:** Púrpuras, rosas, verdes místicos
- **Efectos:** Glassmorphism, glows, sombras

### Animaciones
- **Archivo:** `src/components/effects/`
- Partículas flotantes
- Mariposas animadas
- Hongos brillantes

---

## 🗄️ BASE DE DATOS (SUPABASE)

### Tablas principales
| Tabla | Función |
|-------|---------|
| `profiles` | Datos de usuario (email, display_name) |
| `game_progress` | Progreso (vidas, gemas, niveles, racha) |
| `achievements` | Logros desbloqueados |
| `user_purchases` | Compras realizadas |

### Columnas game_progress
```
- lives, gems, current_level, completed_levels[]
- hammer_count, shuffle_count, undo_count
- current_streak, max_streak, last_login_date
- streak_claimed_today, unlimited_lives_until
- last_life_refill
```

---

## 📁 ESTRUCTURA DE ARCHIVOS CLAVE

```
src/
├── components/
│   ├── Board.tsx              # Tablero de juego
│   ├── Tile.tsx               # Ficha individual
│   ├── GameScreen.tsx         # Pantalla de nivel
│   ├── GameHeader.tsx         # Vidas y gemas
│   ├── Shop.tsx               # Tienda
│   ├── LevelSelect.tsx        # Selector de niveles
│   └── game/
│       ├── AchievementModal.tsx
│       ├── BattlePass.tsx
│       ├── ComboMultiplier.tsx
│       ├── DailyStreakCalendar.tsx
│       ├── FirstDayOffer.tsx
│       ├── LoseBundle.tsx
│       ├── LuckySpin.tsx
│       ├── ProgressionBar.tsx
│       ├── RewardedAds.tsx
│       └── Tutorial.tsx
├── hooks/
│   ├── useAudio.ts            # Sistema de audio
│   ├── useAuth.ts             # Autenticación
│   ├── useGameState.ts        # Estado del juego
│   ├── useAchievements.ts     # Logros
│   ├── useDailyStreak.ts      # Racha diaria
│   └── usePurchases.ts        # Compras
├── data/
│   ├── levels.ts              # 50 niveles
│   └── products.ts            # Productos tienda
└── pages/
    └── Index.tsx              # Pantalla principal
```

---

## 🌐 IDIOMAS SOPORTADOS

| Idioma | Archivo |
|--------|---------|
| 🇪🇸 Español | `src/locales/es.json` |
| 🇬🇧 Inglés | `src/locales/en.json` |
| 🇧🇷 Portugués | `src/locales/pt.json` |

---

## 🔗 URLs

| Tipo | URL |
|------|-----|
| Preview | https://id-preview--b7778f96-6661-4e96-a891-680abe7f31b6.lovable.app |
| Publicada | https://mystic-garden-gems-87023.lovable.app |
| Google Play | (Pendiente aprobación v922) |

---

## ⚠️ COSAS QUE FALTAN O MEJORAR

### 🔴 Prioridad Alta
1. ❌ **Música de fondo** - Falta archivo `public/audio/background-music.mp3`
2. ❌ **Solo 50 niveles** - Considerar añadir 51-100

### 🟡 Prioridad Media
3. ⚠️ **Battle Pass Premium** - Deshabilitado por políticas de Google
4. ⚠️ **Más power-ups** - Solo hay 3 tipos

### 🟢 Ideas Futuras
5. 💡 Eventos temporales (Halloween, Navidad)
6. 💡 Modo multijugador/rankings
7. 💡 Nuevas fichas/temáticas
8. 💡 Misiones diarias

---

## 📊 TIEMPO DE REVISIÓN GOOGLE PLAY

| Situación | Tiempo estimado |
|-----------|-----------------|
| Primera vez | 3-7 días |
| Actualización normal | 24-72 horas |
| Actualización urgente | A veces 2-6 horas |
| Cuenta con historial bueno | Más rápido |

**Tu caso (v922):** Ya tienes la app publicada, así que debería ser 24-72h máximo, posiblemente menos.

---

*Documento generado: 24 Enero 2026*
