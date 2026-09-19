#!/usr/bin/env node
/** Phase 3: failure-style overload + set tags + session plan persistence. */
import {
  TARGET_REPS,
  buildDefaultSet,
  formatSetLine,
  loadStep,
  suggestNextLoad,
} from '../src/lib/overload.ts';
import {
  DEFAULT_WORKING_SETS,
  addMovementToPlan,
  consumePlanForExercise,
  pendingPlan,
  updatePlanItem,
} from '../src/lib/plan.ts';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function set(partial) {
  return {
    id: partial.id ?? 's',
    weight: partial.weight,
    reps: partial.reps,
    warmup: partial.warmup ?? false,
    completedAt: 1,
    toFailure: partial.toFailure,
    dropset: partial.dropset,
    drops: partial.drops,
    emphasis: partial.emphasis ?? null,
  };
}

const hit = [
  set({ weight: 80, reps: 10, toFailure: true }),
  set({ weight: 80, reps: 8, toFailure: true }),
];
const up = suggestNextLoad(hit, 'kg');
assert(up?.action === 'increase', 'hit 8+ on top set increases');
assert(up.weight === 82.5, `kg bump is 2.5, got ${up.weight}`);
assert(up.reps === TARGET_REPS, 'prescription stays 8');

const upLb = suggestNextLoad(hit, 'lb');
assert(upLb?.weight === 85, `lb bump is 5, got ${upLb?.weight}`);
assert(loadStep('kg') === 2.5 && loadStep('lb') === 5, 'unit steps');

const miss = [set({ weight: 80, reps: 6, toFailure: true }), set({ weight: 80, reps: 5, toFailure: true })];
const hold = suggestNextLoad(miss, 'kg');
assert(hold?.action === 'hold' && hold.weight === 80, 'miss 8 holds the load');

const collapse = [set({ weight: 80, reps: 4, toFailure: true }), set({ weight: 80, reps: 3 })];
const down = suggestNextLoad(collapse, 'kg');
assert(down?.action === 'reduce' && down.weight === 77.5, 'hard miss reduces a step');

const drops = [
  set({ weight: 80, reps: 9, toFailure: true, dropset: true, drops: [{ weight: 60, reps: 6 }] }),
  set({ weight: 80, reps: 8, toFailure: true, dropset: true }),
];
const dropHold = suggestNextLoad(drops, 'kg');
assert(dropHold?.action === 'hold' && dropHold.weight === 80, 'hit-with-dropsets holds');

const warmupsOnly = [set({ weight: 40, reps: 10, warmup: true })];
assert(suggestNextLoad(warmupsOnly, 'kg') === undefined, 'warmups do not suggest');

const created = buildDefaultSet({
  id: 'new',
  suggestion: up,
  priorWorking: hit[0],
});
assert(created.toFailure === true, 'working set defaults to failure');
assert(created.warmup === false, 'new set is working');
assert(created.weight === 82.5 && created.reps === 8, 'first working set takes the suggestion');

const warmupDefault = buildDefaultSet({ id: 'wu', partial: { warmup: true, weight: 40, reps: 10 } });
assert(warmupDefault.toFailure === undefined, 'warmup stays unmarked');
assert(warmupDefault.dropset === false, 'warmup is not a dropset');

const afterWarmup = buildDefaultSet({
  id: 'w2',
  last: warmupDefault,
  lastWorking: undefined,
  suggestion: up,
});
assert(afterWarmup.weight === 82.5, 'after a warmup, next working set uses the suggestion not the warmup load');

const tagged = set({
  id: 'tagged',
  weight: 100,
  reps: 8,
  toFailure: true,
  dropset: true,
  drops: [{ weight: 80, reps: 6 }],
  emphasis: 'stretch',
});
const roundTrip = JSON.parse(JSON.stringify({ sets: [tagged] }));
assert(roundTrip.sets[0].toFailure === true, 'toFailure survives workout JSON');
assert(roundTrip.sets[0].dropset === true, 'dropset survives workout JSON');
assert(roundTrip.sets[0].drops[0].weight === 80, 'drop chain survives workout JSON');
assert(roundTrip.sets[0].emphasis === 'stretch', 'emphasis survives workout JSON');
assert(formatSetLine(tagged, 'kg').includes('F'), 'set line shows failure');
assert(formatSetLine(tagged, 'kg').includes('80×6'), 'set line shows drop chain');

const workout = {
  id: 'w',
  date: '2026-09-19',
  status: 'active',
  startedAt: 1,
  updatedAt: 1,
  exercises: [],
  plan: [],
};
const planned = addMovementToPlan(workout, 'barbell-bench-press', {
  id: 'plan-1',
  targetWorkingSets: DEFAULT_WORKING_SETS,
});
assert(planned.plan.length === 1 && planned.plan[0].targetWorkingSets === 2, 'plan defaults to 2 working sets');
const bumped = updatePlanItem(planned, 'plan-1', { targetWorkingSets: 3 });
assert(bumped.plan[0].targetWorkingSets === 3, 'plan stepper persists');
const consumed = consumePlanForExercise(bumped, 'barbell-bench-press');
assert(consumed.targetWorkingSets === 3, 'starting a block copies planned set count');
assert(consumed.plan.length === 0, 'logged movement leaves the plan queue');
const unplanned = consumePlanForExercise(workout, 'barbell-row');
assert(unplanned.targetWorkingSets === undefined, 'just-log path does not invent a plan target');
assert(pendingPlan({ ...bumped, exercises: [{ id: 'e', exerciseId: 'barbell-bench-press', sets: [] }] }).length === 0, 'pending plan hides logged items');

const alreadyLogged = addMovementToPlan(
  { ...workout, exercises: [{ id: 'e', exerciseId: 'barbell-bench-press', sets: [] }] },
  'barbell-bench-press',
  { id: 'plan-2', targetWorkingSets: 3 },
);
assert(alreadyLogged.exercises[0].targetWorkingSets === 3, 'planning a live block only sets its target');
assert((alreadyLogged.plan ?? []).length === 0, 'no duplicate plan row for a live block');

console.log('phase3-smoke ok');
