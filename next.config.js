/** @type {import('next').NextConfig} */
// NOTE: `output: 'export'` was removed. The customer stamp flow needs real
// server API routes (/api/stamp, /api/card, /api/qr/mint) that verify a
// signed QR and run a Firestore transaction with admin credentials — a
// static export cannot run these at all. Deploy this normally on Vercel.
// For the Capacitor/Play Store build, point the Android WebView at the live
// HTTPS production URL instead of bundling a static export (see
// capacitor.config.ts and CAPACITOR-PLAYSTORE.md).
const nextConfig = {
  images: { unoptimized: true }
};
module.exports = nextConfig;
