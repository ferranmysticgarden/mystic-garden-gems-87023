import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.tuempresa.mysticgarden',
  appName: 'Mystic Garden Pro',
  webDir: 'dist',
  server: {
    url: 'https://b75f0079-34c1-44bf-8ca4-240270ce38b2.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
