# ProOverload

Mobile-first gym logger. Ease of logging is the product. Progressive overload, goals, and a muscle map are built from the sets you actually record.

Installable as a PWA. Accounts live in InstantDB (cloud auth + sync) with an IndexedDB outbox so a dropped network mid-set does not lose the log. Email/password is served by the Vite `/api/auth` routes using the Instant admin SDK so you can sign in on a phone without waiting on a magic-code email.

## What it does

- **Log (home):** start or resume today’s session, add an exercise, log weight × reps, optional RPE/notes, big steppers, duplicate last set, warmup vs working, finish. Rest timer is optional and never blocks.
- **Library:** common lifts, search, recents, favorites, custom exercises. Each movement maps to primary and secondary muscles.
- **Overload:** last session loads, suggested next load, working-set history, per-exercise goals.
- **Body:** visual coverage from your own working-set history (not a camera scan). Underworked regions are called out as training-volume guidance only — not a medical diagnosis.
- **History:** past sessions stay editable on the phone.

## Setup

1. Node 20+.
2. Copy `.env.example` to `.env.local`.
3. Create an InstantDB app (`npx instant-cli@latest init-without-files --title ProOverload`) and put the app id in `VITE_INSTANT_APP_ID` and the admin token in `INSTANT_ADMIN_TOKEN`.
4. Push schema and permissions:

```bash
npx instant-cli@latest push schema --yes
npx instant-cli@latest push perms --yes
```

5. `npm install && npm run dev`
6. On a phone (or a ~390px viewport): create an account, log a session, reload — data should still be there from the cloud.

## Offline

Instant’s client cache plus a local outbox. If the network drops while you log a set, the set stays on the device and flushes when connectivity returns. The tab bar shows queued sync. Instant queues transactions while offline; the extra outbox covers auth-token or first-write races.

## Deploy

`npm run build` then host `dist` as a static PWA. Keep a small Node (or Vite preview) process for `/api/auth/signup` and `/api/auth/login`, with `INSTANT_ADMIN_TOKEN` only on the server — never in `VITE_*`.

## Scripts

- `npm run dev` — Vite + auth API + PWA
- `npm run build` — typecheck + production bundle
- `npm run preview` — production build with auth API
