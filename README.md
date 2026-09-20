# ProOverload

Mobile-first gym logger. Ease of logging is the product. Progressive overload, goals, and a muscle map are built from the sets you actually record.

Installable as a PWA. Accounts live in InstantDB (cloud auth + sync) with an IndexedDB outbox so a dropped network mid-set does not lose the log. Email/password is custom (not Instant magic-code): Vite middleware in `npm run dev` / `preview`, and Vercel Node functions in production, both calling shared handlers in `server/auth-core.ts` via `/api/auth/signup` and `/api/auth/login`.

## What it does

- **Log (home):** start or resume today’s session, add an exercise, log weight × reps, optional RPE/notes, big steppers, duplicate last set, warmup vs working, finish. Rest timer is optional and never blocks. Working sets default to failure; optional dropset / stretch / contraction tags stay on the set.
- **Plan:** optional movement queue with a 2–3 working-set target. Logging never waits on a plan.
- **Library:** common lifts, search, recents, favorites, custom exercises. Each movement maps to primary and secondary muscles.
- **Overload:** last session loads, a failure-style next-load suggestion (hit 8 → add a plate; miss → hold/reduce), working-set history, per-exercise goals. One tap applies the suggestion.
- **Desktop:** phone-first PWA shell; from ~1024px the log, library, and body pages use the extra width.
- **Body:** visual coverage from your own working-set history (not a camera scan). The map uses a finer anatomical model (pec heads, trap divisions, quad/hamstring heads, gastroc vs soleus, etc.). Underworked tissues are called out as training-volume guidance only — not a medical diagnosis.
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

## Deploy (Vercel)

Production is the Vite PWA in `dist` plus two Node serverless routes. Auth is not Instant magic-code — the browser `POST`s JSON to `/api/auth/signup` and `/api/auth/login`, and those functions use `@instantdb/admin` with `INSTANT_ADMIN_TOKEN` to create an Instant token.

1. Import this GitHub repo in Vercel (Framework Preset: Vite). `vercel.json` sets the build to `npm run build` and the output directory to `dist`.
2. Set environment variables for **Production** (and **Preview** if you use preview URLs):

   | Variable | Where it is used | Notes |
   | --- | --- | --- |
   | `VITE_INSTANT_APP_ID` | Client **build** and auth functions | Inlined into the browser bundle. Required to build. |
   | `INSTANT_ADMIN_TOKEN` | Auth functions only | Server-only Instant admin token. **Never** prefix this with `VITE_` — Vite would put it in the client bundle. |
   | `INSTANT_APP_ID` | Auth functions (optional) | Same Instant app id if you want a non-`VITE_` name for serverless. Not needed when `VITE_INSTANT_APP_ID` is set for all environments. |

3. Deploy. Do not commit secrets; configure them in the Vercel project settings (or `vercel env add`). This repo does not run `vercel deploy` for you.
4. In the Instant dashboard **Auth** tab, add the production origin (for example `https://your-app.vercel.app`) under **Redirect Origins** / allowed origins so the deployed site may talk to Instant. Repeat for each preview origin you actually use. CLI equivalent: `npx instant-cli@latest auth origin add --type website --url https://your-app.vercel.app`.
5. Open the production URL, create an account, and confirm sign-in.

The app uses `HashRouter` (`/#/…`), so client routes do not need a catch-all rewrite to `index.html`. Do not add a `/(.*)` → `/index.html` rewrite: it can swallow `/api/auth/*`. Those paths are Vercel Node functions (`api/auth/signup.ts`, `api/auth/login.ts`) on the Node runtime.

Vercel typechecks those files with the **root** `tsconfig.json` `compilerOptions`. It does not apply Vite’s project-reference configs (`tsconfig.app.json` / `tsconfig.node.json`), so `/api` and `server/auth-core.ts` use extensionless imports and the root config sets `types: ["node"]`.

Local `npm run dev` and `npm run preview` still serve the same two endpoints through Vite middleware. Behavior is unchanged; only the production host needs the serverless routes.

## Scripts

- `npm run dev` — Vite + auth API + PWA
- `npm run build` — typecheck + production bundle
- `npm run preview` — production build with auth API
- `npm run promote-catalog -- --file payload.json` — print a `CATALOG` row from a promote payload or issue body (never opens/merges a PR)

## Catalog intake

Missing movements (e.g. sissy squats) can be added mid-session as **customs**. Customs sync on the user; they are not written into `src/data/exercises.ts` automatically.

From **You → your custom → Suggest for library**, the app stores `promoteRequestedAt` / `promoteStatus` on the custom JSON and shows a copyable payload plus a pre-filled GitHub issue link (`catalog-promote`). There is no GitHub token in the browser.

Bots and humans: see [docs/catalog-intake.md](docs/catalog-intake.md). Typical path is issue or JSON dump → `node scripts/promote-catalog.mjs` → PR adding one row. **Do not auto-merge.**
