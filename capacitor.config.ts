import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.evoluxe.mysticgarden',
  appName: 'Mystic Garden Pro',
  webDir: 'dist',
  android: {
    backgroundColor: '#9b59b6'
  },
  server: {
    url: 'https://mysticgardenpro.com',
    cleartext: true
  }
};

export default config;
