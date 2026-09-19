#!/usr/bin/env node
/** Lightweight Phase 1 checks for search → infer → promote helpers. */
import { CATALOG, searchCatalog } from '../src/data/exercises.ts';
import {
  hasUsefulCatalogHits,
  inferCustomDefaults,
  titleCaseExerciseName,
} from '../src/lib/customCatalog.ts';
import { buildPromotePayload, formatCatalogRow, formatPromoteIssueBody } from '../src/lib/catalogPromote.ts';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(!CATALOG.some((ex) => /sissy/i.test(ex.name)), 'catalog should not include sissy squat');
const sissyHits = searchCatalog(CATALOG, 'sissy');
assert(sissyHits.length === 0, 'search "sissy" should miss the static catalog');
assert(!hasUsefulCatalogHits(CATALOG, 'sissy'), 'sissy should be a weak/empty search');
assert(hasUsefulCatalogHits(CATALOG, 'squat'), 'squat should hit library names');

const infer = inferCustomDefaults('sissy squat');
assert(infer.confident && infer.primary === 'quads', 'sissy squat infers quads');
assert(infer.equipment === 'bodyweight', 'sissy squat infers bodyweight');
assert(titleCaseExerciseName('sissy squat') === 'Sissy Squat', 'title case');

const payload = buildPromotePayload({
  id: 'test-id',
  name: 'Sissy Squat',
  equipment: 'bodyweight',
  primary: ['quads'],
  secondary: [],
  custom: true,
  promoteRequestedAt: 1,
});
assert(payload.schema === 'prooverload.catalog-promote.v1', 'payload schema');
assert(formatPromoteIssueBody(payload).includes('"customId": "test-id"'), 'issue body has custom id');
assert(formatCatalogRow(payload, 'sissy-squat').includes("id: 'sissy-squat'"), 'printed row');

console.log('phase1-smoke ok');
