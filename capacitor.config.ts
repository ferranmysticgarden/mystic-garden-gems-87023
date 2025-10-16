import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b7778f9666614e96a891680abe7f31b6',
  appName: 'Mystic Garden Pro',
  webDir: 'dist',
  server: {
    url: 'https://b7778f96-6661-4e96-a891-680abe7f31b6.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    backgroundColor: '#9b59b6'
  }
};

export default config;
