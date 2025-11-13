import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gamewala.app',
  appName: 'GameWala',
  webDir: 'dist',
  server: {
    // Allow navigation to Firebase Auth redirects
    allowNavigation: [
      'amewala.firebaseapp.com',
      'amewala.web.app',
      '*.firebaseapp.com',
      '*.googleapis.com',
      'accounts.google.com'
    ]
  },
  android: {
    allowMixedContent: true,
    captureInput: true
  }
};

export default config;
