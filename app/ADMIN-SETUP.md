# Admin Setup — qasimraza7881@gmail.com

## Step 1 — Login once (creates the Firebase Auth user)

Go to:

```
https://yourdomain.com/login?role=admin
```

Sign in with **qasimraza7881@gmail.com** (Google or Email/Password). This only
creates the account — it does not grant admin access yet.

## Step 2 — Promote to admin

Run this from a terminal (Mac Terminal, Windows PowerShell, etc.). Replace
`yourdomain.com` with your real deployed domain, and replace the secret with
the exact `ADMIN_ACTIVATION_SECRET` value you set in Vercel:

```bash
curl -X POST https://yourdomain.com/api/admin/promote \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: YOUR_ADMIN_ACTIVATION_SECRET" \
  -d '{"email":"qasimraza7881@gmail.com"}'
```

## Step 3 — Confirm

Reload:

```
https://yourdomain.com/dashboard?role=admin
```

while logged in as qasimraza7881@gmail.com — admin access should now be active.

## After this

Once qasimraza7881@gmail.com is an admin, any further admin can be promoted
straight from the UI (Admin → Settings) — the curl command + secret is only
needed to bootstrap the very first admin.

## Note

If qr9695242@gmail.com was already promoted to admin earlier, it stays an
admin too — this doesn't remove it. To remove admin access from an account,
that has to be done directly in your Firestore `users`/`admins` data (there's
no "demote" button in this build).

Do not commit this file to a public repo if you fill in real secret values —
keep `ADMIN_ACTIVATION_SECRET` itself only in Vercel's environment variables.
