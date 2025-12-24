import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mysticgarden.game',
  appName: 'Mystic Garden Pro',
  // Version 1.0.1 - December 2025
  webDir: 'dist',
  android: {
    backgroundColor: '#1a0a2e',
    buildOptions: {
      keystorePath: 'app/mystic-garden-release-key.keystore',
      keystoreAlias: 'mystic-garden',
    }
  },
  ios: {
    backgroundColor: '#1a0a2e'
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
