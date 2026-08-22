# Bazaar Go Loyalty — Play Store build

This repository contains the web/PWA source and Capacitor configuration.

## First-time setup

```bash
npm install
npx cap add android
npm run cap:sync
npx cap open android
```

In Android Studio:
- Set the app icon using `public/icons/icon.svg` as the branding source.
- Confirm camera permission for QR scanning.
- Confirm location permission for Nearby/Map.
- Create a release keystore and keep it outside GitHub.
- Build **Build > Generate Signed Bundle / APK > Android App Bundle**.
- Upload the `.aab` to Google Play Console.

## Production URL option

For a server-backed production app, keep Firebase and server APIs on the deployed HTTPS site. Do not ship Admin SDK private keys in the Android/web bundle.
