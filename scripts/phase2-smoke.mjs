#!/usr/bin/env node
/** Phase 2: finer muscle taxonomy, catalog consistency, legacy remap. */
import { CATALOG } from '../src/data/exercises.ts';
import {
  LEGACY_MUSCLE_MAP,
  MUSCLE_ID_SET,
  MUSCLE_LABEL,
  MUSCLES,
  catalogUsesOnlyCurrentIds,
  formatMuscleList,
  normalizeCatalogExercise,
  remapMuscleIds,
} from '../src/data/muscles.ts';
import { inferCustomDefaults } from '../src/lib/customCatalog.ts';
import { analyzeBody } from '../src/lib/bodyAnalysis.ts';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(MUSCLES.length === 38, `expected 38 visualizable muscles, got ${MUSCLES.length}`);
assert(MUSCLES.every((m) => MUSCLE_ID_SET.has(m.id) && MUSCLE_LABEL[m.id] === m.label), 'MUSCLES / labels aligned');
assert(!MUSCLE_ID_SET.has('chest'), 'coarse chest is not a current MuscleId');
assert(!MUSCLE_ID_SET.has('quads'), 'coarse quads is not a current MuscleId');

for (const [legacy, mapped] of Object.entries(LEGACY_MUSCLE_MAP)) {
  assert(mapped.length > 0, `${legacy} maps to at least one tissue`);
  assert(mapped.every((id) => MUSCLE_ID_SET.has(id)), `${legacy} maps only to current ids`);
}

assert(
  JSON.stringify(remapMuscleIds(['chest', 'front_delts', 'pectoralis_sternal'])) ===
    JSON.stringify(['pectoralis_clavicular', 'pectoralis_sternal', 'pectoralis_costal', 'anterior_deltoid']),
  'legacy + current ids remap and dedupe',
);

const oldCustom = normalizeCatalogExercise({
  id: 'legacy',
  name: 'Old Bench',
  equipment: 'barbell',
  primary: ['chest'],
  secondary: ['front_delts', 'triceps'],
});
assert(oldCustom.primary.includes('pectoralis_sternal'), 'old chest custom keeps pec coverage');
assert(oldCustom.secondary.includes('anterior_deltoid'), 'old front_delts remaps');
assert(oldCustom.secondary.includes('triceps_long'), 'old triceps expands');
assert(formatMuscleList(['quads']).includes('Rectus femoris'), 'labels follow remap');

for (const ex of CATALOG) {
  assert(catalogUsesOnlyCurrentIds(ex), `${ex.id} still has a legacy MuscleId`);
  assert(ex.primary.length > 0, `${ex.id} needs a primary`);
}

const bench = CATALOG.find((ex) => ex.id === 'barbell-bench-press');
assert(bench.primary.includes('pectoralis_sternal'), 'flat bench → sternal pec');
const incline = CATALOG.find((ex) => ex.id === 'incline-bench-press');
assert(incline.primary.includes('pectoralis_clavicular'), 'incline → clavicular pec');
const seatedCalf = CATALOG.find((ex) => ex.id === 'seated-calf-raise');
assert(seatedCalf.primary.includes('soleus'), 'seated calf → soleus');
const standingCalf = CATALOG.find((ex) => ex.id === 'standing-calf-raise');
assert(standingCalf.primary.includes('gastrocnemius'), 'standing calf → gastroc');
const ohp = CATALOG.find((ex) => ex.id === 'overhead-triceps-extension');
assert(ohp.primary.includes('triceps_long'), 'overhead extension → long head');

assert(inferCustomDefaults('hammer curl').primary === 'brachialis', 'hammer infers brachialis');
assert(inferCustomDefaults('face pull').secondary.includes('rotator_cuff'), 'face pull tags cuff');

const analysis = analyzeBody(
  [
    {
      id: 'w1',
      date: '2026-09-19',
      status: 'finished',
      startedAt: Date.now(),
      updatedAt: Date.now(),
      exercises: [
        {
          id: 'e1',
          exerciseId: 'legacy',
          sets: [{ id: 's1', weight: 80, reps: 8, warmup: false, completedAt: Date.now() }],
        },
      ],
    },
  ],
  [oldCustom],
);
const sternal = analysis.stats.find((s) => s.id === 'pectoralis_sternal');
assert(sternal && sternal.volume > 0, 'legacy chest custom paints sternal pec on the map');
const clav = analysis.stats.find((s) => s.id === 'pectoralis_clavicular');
assert(clav && clav.volume > 0, 'legacy chest custom paints clavicular pec');

console.log('phase2-smoke ok');
