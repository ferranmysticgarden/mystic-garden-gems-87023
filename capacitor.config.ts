import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mysticgarden.game',
  appName: 'Mystic Garden Pro',
  webDir: 'dist',
  android: {
    backgroundColor: '#1a0a2e',
  },
  ios: {
    backgroundColor: '#1a0a2e'
  },
  server: {
    // OTA: Load web content from the published URL.
    // Web changes deploy instantly without a new AAB.
    // The local 'dist/' folder is still bundled as a fallback.
    url: 'https://mystic-garden-gems-87023.lovable.app?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a0a2e',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP'
    }
  }
};

export default config;
