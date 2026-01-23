/**
 * RewardedAdPlaceholder - Lógica preparada para anuncios recompensados
 * 
 * ESTADO: DESHABILITADO - Solo lógica preparada, no se muestra UI
 * 
 * Casos de uso preparados:
 * 1. Continuar nivel sin perder vidas
 * 2. Reintentar nivel con movimientos extra
 * 3. Obtener gemas gratis
 * 4. Proteger racha diaria
 * 
 * Para activar: cambiar ENABLED a true y descomentar el UI
 */

import { useState, useCallback } from 'react';

// ⚠️ CAMBIAR A true PARA ACTIVAR
const ENABLED = false;

interface RewardedAdConfig {
  type: 'continue' | 'retry' | 'gems' | 'streak';
  reward: {
    lives?: number;
    gems?: number;
    moves?: number;
    streakProtection?: boolean;
  };
}

const AD_CONFIGS: Record<string, RewardedAdConfig> = {
  continue: {
    type: 'continue',
    reward: { lives: 1 },
  },
  retry: {
    type: 'retry', 
    reward: { moves: 5 },
  },
  gems: {
    type: 'gems',
    reward: { gems: 20 },
  },
  streak: {
    type: 'streak',
    reward: { streakProtection: true },
  },
};

export const useRewardedAd = () => {
  const [isWatching, setIsWatching] = useState(false);
  const [adType, setAdType] = useState<string | null>(null);

  const showRewardedAd = useCallback(async (
    type: keyof typeof AD_CONFIGS,
    onReward: (reward: RewardedAdConfig['reward']) => void,
    onSkip?: () => void
  ) => {
    if (!ENABLED) {
      console.log('[RewardedAd] Disabled - would show:', type);
      return false;
    }

    const config = AD_CONFIGS[type];
    if (!config) return false;

    setAdType(type);
    setIsWatching(true);

    // Simular visualización de anuncio (en producción: integrar AdMob)
    // En producción reemplazar con:
    // await AdMob.showRewardedAd({ adId: 'ca-app-pub-xxx/xxx' });

    return new Promise<boolean>((resolve) => {
      // Simulación: 5 segundos de "anuncio"
      setTimeout(() => {
        setIsWatching(false);
        setAdType(null);
        onReward(config.reward);
        resolve(true);
      }, 5000);
    });
  }, []);

  const isEnabled = ENABLED;

  return {
    isEnabled,
    isWatching,
    adType,
    showRewardedAd,
  };
};

// Componente de UI (deshabilitado por ahora)
interface RewardedAdButtonProps {
  type: keyof typeof AD_CONFIGS;
  onReward: (reward: RewardedAdConfig['reward']) => void;
  children: React.ReactNode;
  className?: string;
}

export const RewardedAdButton = ({ 
  type, 
  onReward, 
  children, 
  className 
}: RewardedAdButtonProps) => {
  const { isEnabled, showRewardedAd } = useRewardedAd();

  if (!isEnabled) {
    // Cuando está deshabilitado, no renderizar nada
    return null;
  }

  // Cuando esté habilitado, mostrar botón
  return (
    <button
      onClick={() => showRewardedAd(type, onReward)}
      className={className}
    >
      {children}
    </button>
  );
};

// Tipos exportados para uso futuro
export type { RewardedAdConfig };
export { AD_CONFIGS, ENABLED as REWARDED_ADS_ENABLED };
