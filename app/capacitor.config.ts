import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bazaargo.loyalty',
  appName: 'Bazaar Go Loyalty',
  // `webDir` is kept only so `cap sync` has a folder to look at; it is not
  // used at runtime because `server.url` below loads the live deployed site.
  // The app needs real API routes (/api/stamp, /api/card) that only exist on
  // the deployed server — a bundled static export cannot run them.
  webDir: 'out',
  server: {
    // TODO: replace with the real production domain before building the release .aab
    url: 'https://REPLACE-WITH-YOUR-VERCEL-DOMAIN.vercel.app',
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false
  }
};

export default config;
