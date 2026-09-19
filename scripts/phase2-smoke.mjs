#!/usr/bin/env node
/** Phase 2: finer muscle taxonomy, catalog consistency, legacy remap. */
import { CATALOG } from '../src/data/exercises.ts';
import {
  CATALOG_OPTIONAL_MUSCLES,
  LEGACY_MUSCLE_MAP,
  MUSCLE_ID_SET,
  MUSCLE_LABEL,
  MUSCLES,
  catalogMuscleIds,
  catalogUsesOnlyCurrentIds,
  coversLegacyGroup,
  formatMuscleList,
  normalizeCatalogExercise,
  remapMuscleIds,
} from '../src/data/muscles.ts';
import { inferCustomDefaults } from '../src/lib/customCatalog.ts';
import { analyzeBody, suggestExercisesFor } from '../src/lib/bodyAnalysis.ts';

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

const SQUAT_FAMILY = [
  'barbell-back-squat',
  'front-squat',
  'hack-squat',
  'leg-press',
  'bulgarian-split-squat',
  'walking-lunge',
  'goblet-squat',
  'smith-squat',
  'step-up',
  'sumo-deadlift',
];
const SHRUG_FAMILY = ['shrug', 'dumbbell-shrug'];
const HINGE_FAMILY = ['romanian-deadlift', 'good-morning'];

function catalogRow(id) {
  const ex = CATALOG.find((row) => row.id === id);
  assert(ex, `missing catalog row ${id}`);
  return ex;
}

for (const id of SQUAT_FAMILY) {
  assert(coversLegacyGroup(catalogRow(id), 'quads'), `${id} should cover LEGACY quads (RF/VL/VM)`);
}
for (const id of SHRUG_FAMILY) {
  assert(coversLegacyGroup(catalogRow(id), 'traps'), `${id} should cover LEGACY traps (upper/mid/lower)`);
}
for (const id of HINGE_FAMILY) {
  assert(coversLegacyGroup(catalogRow(id), 'hamstrings'), `${id} should cover LEGACY hamstrings`);
}

const squatInfer = inferCustomDefaults('goblet squat');
assert(
  coversLegacyGroup({ primary: [squatInfer.primary], secondary: squatInfer.secondary }, 'quads'),
  'squat inference covers RF/VL/VM like LEGACY quads',
);
const shrugInfer = inferCustomDefaults('barbell shrug');
assert(
  coversLegacyGroup({ primary: [shrugInfer.primary], secondary: shrugInfer.secondary }, 'traps'),
  'shrug inference covers upper/mid/lower like LEGACY traps',
);

assert(
  JSON.stringify(remapMuscleIds(['quads'])) === JSON.stringify(LEGACY_MUSCLE_MAP.quads),
  'remapMuscleIds(quads) matches LEGACY_MUSCLE_MAP',
);
assert(
  JSON.stringify(remapMuscleIds(['traps'])) === JSON.stringify(LEGACY_MUSCLE_MAP.traps),
  'remapMuscleIds(traps) matches LEGACY_MUSCLE_MAP',
);

const covered = catalogMuscleIds(CATALOG);
for (const id of MUSCLE_ID_SET) {
  if (CATALOG_OPTIONAL_MUSCLES.includes(id)) {
    assert(!covered.has(id), `${id} is allowlisted as catalog-optional but appears on a static row`);
    continue;
  }
  assert(covered.has(id), `${id} has no catalog row and is not in CATALOG_OPTIONAL_MUSCLES`);
}

const emptyWeek = analyzeBody([], CATALOG);
assert(
  !emptyWeek.underworked.some((s) => CATALOG_OPTIONAL_MUSCLES.includes(s.id)),
  'underworked ignores tissues with no catalog mapping',
);
assert(
  emptyWeek.underworked.every((s) => covered.has(s.id)),
  'underworked only includes catalog-mapped tissues',
);
assert(
  !emptyWeek.underworked.some((s) => s.id === 'sternocleidomastoid'),
  'SCM is not permanently underworked',
);
assert(
  suggestExercisesFor(emptyWeek.underworked.slice(0, 4).map((m) => m.id), CATALOG).length > 0,
  'Try-next finds catalog rows for underworked mapped tissues',
);

const withNeck = analyzeBody(
  [],
  [
    ...CATALOG,
    { id: 'neck-curl', name: 'Neck Curl', equipment: 'other', primary: ['sternocleidomastoid'], secondary: [] },
  ],
);
assert(
  withNeck.underworked.some((s) => s.id === 'sternocleidomastoid'),
  'SCM can enter underworked once a movement maps there',
);

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
