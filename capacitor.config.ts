import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mysticgarden.pro2',
  appName: 'Mystic Garden Pro 2',
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
