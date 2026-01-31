import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Android 15+ edge-to-edge support hook
 * Dynamically enables or disables the Edge-to-Edge plugin based on OS version.
 * This fixes Google Play Console warnings about deprecated edge-to-edge APIs.
 */
export const useEdgeToEdge = () => {
  useEffect(() => {
    const initializeEdgeToEdge = async () => {
      try {
        // Only run on Android native platform
        if (Capacitor.getPlatform() !== 'android') return;

        // Dynamically import to avoid issues on web/iOS
        const { EdgeToEdge } = await import('@capawesome/capacitor-android-edge-to-edge-support');
        const { Device } = await import('@capacitor/device');
        
        const info = await Device.getInfo();
        const osVersion = Number(info.osVersion);

        // Enable Edge-to-Edge for Android 15+, disable for older versions
        if (osVersion >= 15) {
          await EdgeToEdge.enable();
          console.log('Edge-to-Edge enabled for Android 15+');
        } else {
          await EdgeToEdge.disable();
          console.log('Edge-to-Edge disabled for Android < 15');
        }
      } catch (error) {
        console.warn('Edge-to-Edge plugin initialization failed:', error);
      }
    };

    initializeEdgeToEdge();
  }, []);
};
