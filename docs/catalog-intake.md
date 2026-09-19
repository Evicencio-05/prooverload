# Catalog intake (customs → shared library)

Phase 1 lets a lifter add a missing movement mid-session as a **custom** exercise. Customs stay on the user (`customExercises` Instant JSON + IndexedDB). They are **not** merged into `src/data/exercises.ts` automatically.

This note is for ProOverload Intake bots and humans who turn a promote request into a catalog PR.

## What the app stores

On the custom exercise JSON payload (same Instant entity, no schema change):

| Field | Meaning |
| --- | --- |
| `custom: true` | User-owned movement |
| `updatedAt` | LWW merge timestamp |
| `promoteRequestedAt` | Client marked “Suggest for library” |
| `promoteStatus` | `requested` or `submitted` |
| `promoteNote` | Optional reviewer note |

The browser has **no GitHub token**. Suggesting for the library:

1. Writes the promote fields on the custom.
2. Shows a copyable promote payload + a pre-filled GitHub issue URL.

## GitHub issue

- Label: `catalog-promote` (create it once on `Evicencio-05/prooverload` if missing).
- Template: `.github/ISSUE_TEMPLATE/catalog-promote.yml`
- Pre-filled issues from the app use that label, title `Promote: <name>`, and a body that includes a `json` fence.

Issue body contract (v1):

```json
{
  "schema": "prooverload.catalog-promote.v1",
  "name": "Sissy Squat",
  "aliases": [],
  "equipment": "bodyweight",
  "primary": ["rectus_femoris", "vastus_medialis"],
  "secondary": [],
  "customId": "<uuid>",
  "note": "",
  "promoteRequestedAt": 0
}
```

`customId` is the user’s custom UUID. The static catalog row should get a **new kebab-case `id`** from the name (logs already point at the custom id; do not rewrite history).

## Bot / human steps

1. Collect inputs — an issue labeled `catalog-promote`, a pasted payload, or a JSON dump of customs where `promoteStatus` is set.
2. Print a catalog row (does **not** open or merge a PR):

```bash
node scripts/promote-catalog.mjs --file payload.json
gh issue view 12 --json body --jq .body | node scripts/promote-catalog.mjs --stdin
```

3. Confirm the name is not already in `src/data/exercises.ts` (the script warns on duplicate id/name).
4. Open a PR that adds the printed row to `CATALOG`. **Do not auto-merge.** A human reviews muscle mapping against the current anatomical `MuscleId` set in `src/data/muscles.ts`.
5. After merge, leave the user’s custom in place. Optional later work: mark `promoteStatus: "submitted"` in Instant — not required for Phase 1.

Phase 1 coarse ids (`chest`, `quads`, `triceps`, …) still appear on older custom / promote JSON. `remapMuscleIds` in `src/data/muscles.ts` expands those to the current tissues before analysis, labels, or printing a catalog row. Prefer writing the fine ids on new rows.

## Out of scope

- Instant admin secrets in the client
- Auto-merging PRs
- Changing Instant entity shape (keep using the JSON blob)
