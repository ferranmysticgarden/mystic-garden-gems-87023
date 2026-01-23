import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdSize, BannerAdPosition, BannerAdPluginEvents } from '@capacitor-community/admob';

// Production Banner Ad Unit ID
const BANNER_AD_ID = 'ca-app-pub-7198650429290924/5826208729';

interface AdBannerProps {
  visible?: boolean;
}

export const AdBanner = ({ visible = true }: AdBannerProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(false);

  useEffect(() => {
    const initializeAds = async () => {
      // Solo inicializar en dispositivos nativos
      if (!Capacitor.isNativePlatform()) {
        setShowPlaceholder(true);
        return;
      }

      try {
        await AdMob.initialize({
          initializeForTesting: false, // Production mode
        });
        setIsInitialized(true);
      } catch (error) {
        console.log('AdMob initialization error:', error);
        setShowPlaceholder(true);
      }
    };

    initializeAds();
  }, []);

  useEffect(() => {
    if (!isInitialized || !visible) return;

    const showBanner = async () => {
      try {
        // Configurar listeners
        AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
          console.log('Banner loaded');
        });

        AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (error) => {
          console.log('Banner failed to load:', error);
          setShowPlaceholder(true);
        });

        // Mostrar el banner
        await AdMob.showBanner({
          adId: BANNER_AD_ID,
          adSize: BannerAdSize.BANNER, // 320x50
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: false, // Production mode
        });
      } catch (error) {
        console.log('Error showing banner:', error);
        setShowPlaceholder(true);
      }
    };

    showBanner();

    // Cleanup al desmontar
    return () => {
      if (Capacitor.isNativePlatform()) {
        AdMob.removeBanner().catch(console.log);
      }
    };
  }, [isInitialized, visible]);

  // Ocultar el banner cuando no está visible
  useEffect(() => {
    if (!isInitialized) return;

    if (!visible) {
      AdMob.hideBanner().catch(console.log);
    } else {
      AdMob.resumeBanner().catch(console.log);
    }
  }, [visible, isInitialized]);

  // Si no está visible, no renderizar nada
  if (!visible) return null;

  // Placeholder para web/preview - simula el espacio del banner
  if (showPlaceholder) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-background/95 border-t border-border/50 backdrop-blur-sm">
          <div className="h-[50px] flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span className="opacity-50">📱</span>
              <span className="opacity-60">Ad Space (320×50) - Test Mode</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // En dispositivo nativo, AdMob renderiza el banner automáticamente
  // Solo necesitamos el espacio reservado
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-[50px] bg-background/90" />
  );
};
