# Bazaar Go Loyalty

Production-oriented Next.js + Firebase architecture for QR loyalty.

## Everything fixed / completed in this pass

1. **Reward redeem — real now.** `POST /api/redeem` (business-owner auth
   required) confirms a ready reward inside a Firestore transaction: resets
   stamps, increments `rewardsEarned`, logs a `redeem` transaction. A
   "🎁 Redeem" button appears on the dashboard's Customers table once a
   customer reaches the required stamp count.
2. **Customer-creation Firestore rule hardened.** Only an admin, or the
   business owner creating a customer under their own `businessId`, can
   create a `customers/{id}` doc from the client. The public `/api/stamp`
   scan flow is unaffected — it writes via Firebase Admin on the server,
   which bypasses these rules entirely.
3. **Logo moved out of Firestore into Firebase Storage.** Uploads now go to
   `business-logos/{businessId}/...` instead of a base64 string on the
   business document. Added `firebase/storage.rules` (public read,
   owner-only write, 5MB max, images only) and wired it into `firebase.json`.
4. **Scratch Cards — fully built.** Business dashboard has a new "Scratch
   Cards" page to create/pause/delete campaigns (title, reward text, win
   chance %). Customers see active cards on `/card` and can scratch once
   per card. Win/lose is decided **server-side** in `POST /api/scratch`
   (Firestore transaction) so the outcome can't be tampered with from the
   browser, and each card can only be scratched once per customer.
5. **Nearby / Shop Map for customers — fully built.** New public
   `GET /api/businesses/nearby` endpoint returns only safe, non-sensitive
   business fields (name, category, address, lat/lng) — never phone,
   email, or subscription data — sorted by distance if the browser shares
   location. New `/nearby` page uses `navigator.geolocation` and links to
   Google Maps directions for each shop. Linked from the homepage and from
   the customer's loyalty card page.
6. **QR scanning now works without native `BarcodeDetector`.** Added the
   pure-JS `jsqr` package as a fallback for both the live camera scan and
   the "Scan QR Image" upload, so browsers like iOS Safari (which don't
   support `BarcodeDetector`) can still scan.

## Not changed (by design, not bugs)

- **Payment stays manual** (WhatsApp confirmation + admin activation code)
  — this was the intended architecture, not an automated payment gateway.
- **Build not run in this environment** — this sandbox has no network
  access, so `npm install` / `npm run build` could not be executed here.
  Every changed file was syntax-checked (route files with `node --check`,
  JSX files with bracket-balance checks) and reviewed by hand, but you
  should still run `npm install && npm run build` yourself before
  deploying, per the existing README note below.

## Business Details + Admin Businesses system

Every business now carries: business name, owner name, phone, email,
complete address, category, profile picture (Firebase Storage), map
location, branches, registration date (`createdAt`), active package
(`activePackage`), status (`active`), payment status (`paymentStatus`:
"paid"/"pending"), and subscription start/expiry
(`subscriptionStart` / `subscriptionActiveUntil`).

- **Admin → Businesses** now shows a full table (business, owner/phone,
  category, status, payment) with per-business **View Details** (a modal
  with every field above, including logo and a "open in Maps" link),
  **Edit** (a modal a for admin to correct any business's details
  directly), **Activate/Suspend**, and **Mark Paid/Pending** actions.
- Approving a subscription request now also stamps `subscriptionStart`,
  `activePackage`, and sets `paymentStatus: "paid"` automatically.
- **Business owner → Profile** shows a read-only summary card
  (registration date, package, status, payment, expiry) next to the
  existing editable fields (name/owner/phone/address/category/email) and
  logo upload, so an owner can see their own account status and still
  edit/add their profile info.

No Firestore rule changes were needed for this — admins already had full
`update` rights on `businesses/{id}`, and business owners already had
`update` rights on their own business doc.

## Deploy checklist after this update

```bash
npm install
npm run build   # verify locally before deploying
firebase deploy --only firestore:rules,firestore:indexes
```

## Troubleshooting: "QR scan shows no data" / "Download button does nothing"

This almost always means one or more **server env vars are missing** on your actual deployment (Vercel, etc.), not a code bug — the QR code, the customer scan flow, and the downloads all depend on the server being able to talk to Firebase Admin.

Visit `https://yourdomain.com/api/health` after deploying — it now returns exactly which required variable is missing, for example:

```json
{
  "ok": false,
  "missing": [
    "QR_SIGNING_SECRET — needed to generate/verify the shop QR code. Without it, the QR page and downloads stay blank/disabled.",
    "FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY — needed for the server (scan, card, stamp, QR mint) to talk to Firestore."
  ]
}
```

Add whatever it lists under Vercel → Project → Settings → Environment Variables (see the full list below), redeploy, then re-check `/api/health` until `"ok": true`.

The QR/Download buttons on the dashboard now also give a clear on-screen message (instead of silently doing nothing) if the QR isn't ready yet — tap **Regenerate** first if that happens.

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open http://localhost:3000.

## Firebase

1. Create a Firebase project.
2. Enable Authentication: Google and Email/Password.
3. Create Firestore Database.
4. Enable Storage.
5. Add your Web App credentials to `.env.local`.
6. Deploy rules/indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

7. Add your Vercel domain to Firebase Authentication authorized domains.

## Server-only secrets

`FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `QR_SIGNING_SECRET`, and `ADMIN_ACTIVATION_SECRET` are server-only. Do not put them in `NEXT_PUBLIC_*` variables or browser code.

## Customer flow (now real / Firestore-backed)

Customer scans a signed business/branch QR at `/scan`. `POST /api/stamp` verifies
the QR signature/expiry, confirms the business is active, then runs a Firestore
transaction to create or update `customers/{businessId}_{phone}`, cap stamps at
the shop's required count, mark a reward ready, and log a `transactions` row.
A cooldown (`STAMP_COOLDOWN_MINUTES`, default 60) stops the same QR being
re-scanned for repeat free stamps. The customer is then sent to `/card`, which
reads live data from `GET /api/card`.

### Generating a test shop QR

There's no business dashboard yet to generate QR codes, so use the admin-only
minting endpoint to create one for testing:

```bash
curl -X POST https://your-deployment/api/qr/mint \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: $ADMIN_ACTIVATION_SECRET" \
  -d '{"businessId":"biz_demo","businessName":"Bazaar Go Coffee House","requiredStamps":9}'
```

This upserts a `businesses/biz_demo` doc and returns `qrValue`, e.g.
`BAZAARGO:eyJ...`. Turn that string into a QR code (any QR generator) and scan
it from `/scan` to test the real stamp flow end-to-end.

### Important: server routes need a real server, not a static export

`next.config.js` no longer uses `output: 'export'`. The stamp/QR/card routes
run Firebase Admin transactions with server-only secrets — a static export
can't execute them. Deploy the Next.js app normally on Vercel. For the
Capacitor/Play Store build, `capacitor.config.ts` now points the Android
WebView at the live production URL (`server.url`) instead of bundling a
static export — replace the placeholder domain there before building the
release `.aab`.

## Subscription

Current package architecture:
- 3 months: PKR 5,000
- 6 months: PKR 10,000
- 12 months: PKR 20,000

Payment instructions:
- JazzCash/Easypaisa: 03244996576 — Qasim Raza
- Meezan Bank: 11570114385195 — Qasim A Traders
- WhatsApp: 03244996576

The payment provider is intentionally separated from the core subscription model. Do not treat a browser-entered activation code as proof of payment. In production, the admin code must be generated/validated server-side.

## Admin panel (real data)

The admin dashboard (`/dashboard?role=admin`) is Firestore-backed: businesses,
customers, transactions and pending subscription activations are all live.
There is no self-serve admin signup — you must be promoted.

### Bootstrapping the first admin

1. Log in once at `/login?role=admin` (email/password or Google) with the
   account you want to be admin — this just creates the Firebase Auth user.
2. Promote that account using the secret-protected endpoint:

```bash
curl -X POST https://your-deployment/api/admin/promote \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: $ADMIN_ACTIVATION_SECRET" \
  -d '{"email":"you@example.com"}'
```

3. Reload `/dashboard?role=admin` — you now have admin access. From
   **Admin → Settings** you can promote further admins by email without
   needing the secret again (any existing admin can do this from the UI).

### What the admin can do

- **Businesses**: see every business, suspend/activate one.
- **Customers**: see every customer across all shops (name, phone, business, stamps/visits).
- **Subscriptions**: review pending activation-code submissions from business
  owners and Approve (marks the business active and sets an expiry from the
  package length) or Reject.
- **Reports**: quick platform totals.

## PWA

For installability on a hosted production deployment, add a proper web manifest, service worker, icons and HTTPS. On iOS, use Safari's Add to Home Screen flow.

## Admin

Do not grant admin access from a query parameter or client-side role. Store the role in a protected user record/custom claim and enforce it with server-side checks and Firestore Rules.

## Build

```bash
npm run build
npm start
```


## Vercel environment variables

Before deploying, open Vercel Project → Settings → Environment Variables and add:

- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY
- QR_SIGNING_SECRET
- ADMIN_ACTIVATION_SECRET
- WHATSAPP_NUMBER
- NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
- NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

Set them for Production (and Preview if you test preview deployments), then redeploy.

The public Firebase Web API key is not a private server secret; the private Admin credentials and QR signing secret must remain server-only.

## Image uploads (Cloudinary)

Business logo/profile picture uploads go through **Cloudinary** instead of Firebase Storage, because Firebase Storage requires the paid Blaze plan while Cloudinary's free tier works out of the box. All other business/customer data (profile fields, stamps, scratch cards, analytics) still lives in Firestore as before — only the actual image *file* is hosted on Cloudinary; Firestore just stores the resulting image URL.

Setup:
1. Create a free account at cloudinary.com and open the Dashboard — copy your **Cloud Name**.
2. Go to Settings → Upload → Upload presets → Add upload preset.
3. Set **Signing Mode** to **Unsigned** (required for direct browser uploads), optionally restrict the folder/allowed formats, and save. Copy the preset name.
4. Add to `.env.local` (and Vercel env vars):
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name`
   - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset-name`

Both are safe to expose to the browser — an unsigned preset only allows uploads (not deletes or reads of other files).

## Full Bazaar Go website update

Customer no longer has a customer-login button on the public homepage. Customer entry is QR-first: Scan Shop QR → name + phone on first visit → loyalty card.

Included UI/workflows:
- Customer QR scan, loyalty card, rewards, history, nearby/shop map and profile
- Business Owner: overview, customer name/phone/Gmail list, loyalty programs, rewards, QR PNG/print/regenerate, branches, shop map/location, digital menu, scratch cards, analytics, profile picture/edit, subscriptions and settings
- Admin: dashboard, businesses, all customers with phone, programs, rewards, transactions, branches, map, subscriptions, reports and settings
- Google/Email login + forgot-password entry points
- Packages: 3 months PKR 5,000; 6 months PKR 12,000; 12 months PKR 20,000
- JazzCash/Easypaisa: 03244996576 (Qasim Raza)
- Meezan Bank: 11570114385195 (Qasim A Traders)
- WhatsApp payment confirmation flow
- Admin activation-code workflow UI
- PWA manifest/service worker already included

Important: Firebase/Firestore data writes, role enforcement, payment verification and activation must be configured with the project's server/Firebase environment variables and security rules before treating the demo UI as production payment/accounting infrastructure.

## Android / Google Play Store

This project is prepared for Capacitor Android packaging.

1. Install dependencies: `npm install`
2. Add Android once: `npx cap add android`
3. Build/sync: `npm run cap:sync`
4. Open Android Studio: `npm run cap:open`
5. In Android Studio create a signed **Android App Bundle (.aab)** for Play Store release.

Application ID: `com.bazaargo.loyalty`
Application name: `Bazaar Go Loyalty`

Camera and location permissions should be requested only when the related feature is used. Configure these in the generated Android project before release.

### Important
- Do NOT put `FIREBASE_PRIVATE_KEY`, Firebase Admin credentials, QR signing secrets, or admin activation secrets in GitHub.
- Keep production secrets in Vercel environment variables / secure server configuration.
- The Firebase Web API key may be public, but Firebase Security Rules must protect Firestore data.
- For Google Play, complete Play App Signing, privacy policy, Data Safety, content rating, and account/developer verification requirements in Play Console.
