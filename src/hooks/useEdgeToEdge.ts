import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Android 15+ edge-to-edge support hook
 * Edge-to-edge is configured natively via styles.xml and AndroidManifest.xml.
 * This hook handles any runtime adjustments needed for safe area insets.
 */
export const useEdgeToEdge = () => {
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    // Edge-to-edge is handled natively via Android styles.xml
    // The theme uses Theme.SplashScreen with windowTranslucentStatus/Navigation
    // No runtime plugin needed — this avoids Capacitor 7/8 version conflicts
    console.log('Edge-to-Edge: configured natively via Android theme');
  }, []);
};
