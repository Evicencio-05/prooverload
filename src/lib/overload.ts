import type { CatalogExercise, LoggedSet, Unit, Workout } from '../types';

export type OverloadAction = 'increase' | 'hold' | 'reduce';

export type OverloadSuggestion = {
  weight: number;
  reps: number;
  action: OverloadAction;
  reason: string;
  increment: number;
};

/** Double-progression floor for 2–3 hard sets to failure. */
export const TARGET_REPS = 8;
export const HARD_MISS_REPS = 5;

export function loadStep(unit: Unit): number {
  return unit === 'kg' ? 2.5 : 5;
}

export function workingSets(sets: LoggedSet[]): LoggedSet[] {
  return sets.filter((s) => !s.warmup);
}

export function topWorkingSet(sets: LoggedSet[]): LoggedSet | undefined {
  const w = workingSets(sets);
  if (!w.length) return undefined;
  return [...w].sort((a, b) => b.weight - a.weight || b.reps - a.reps)[0];
}

export function lastSessionForExercise(
  workouts: Workout[],
  exerciseId: string,
  exceptWorkoutId?: string,
): { workout: Workout; block: Workout['exercises'][number] } | undefined {
  const finished = workouts
    .filter((w) => w.status === 'finished' && w.id !== exceptWorkoutId)
    .sort((a, b) => b.startedAt - a.startedAt);
  for (const workout of finished) {
    const block = [...workout.exercises].reverse().find((e) => e.exerciseId === exerciseId);
    if (block && block.sets.length) return { workout, block };
  }
  return undefined;
}

export function workingLoadHistory(
  workouts: Workout[],
  exerciseId: string,
): { date: string; weight: number; reps: number }[] {
  const rows: { date: string; weight: number; reps: number }[] = [];
  const ordered = [...workouts]
    .filter((w) => w.status === 'finished')
    .sort((a, b) => a.startedAt - b.startedAt);
  for (const w of ordered) {
    for (const block of w.exercises) {
      if (block.exerciseId !== exerciseId) continue;
      const top = topWorkingSet(block.sets);
      if (top) rows.push({ date: w.date, weight: top.weight, reps: top.reps });
    }
  }
  return rows;
}

/**
 * Next load for low-volume failure work (typically 2–3 hard sets).
 * Top working set is the prescription. Hit ≥8 with later sets still alive → nudge
 * the plate; miss the 8 → hold; collapse below 5 → drop a step. Dropset-heavy
 * sessions that already hit the target stay put (intensity was already high).
 */
export function suggestNextLoad(
  lastSets: LoggedSet[],
  unit: Unit,
): OverloadSuggestion | undefined {
  const w = workingSets(lastSets);
  if (!w.length) return undefined;
  const top = topWorkingSet(w)!;
  const bump = loadStep(unit);
  const load = top.weight;
  const laterOk = w.every((s) => s.reps >= HARD_MISS_REPS);
  const collapsed = top.reps < HARD_MISS_REPS || w.every((s) => s.reps < 6);
  const dropHeavy = w.filter((s) => s.dropset).length >= Math.ceil(w.length / 2);

  if (collapsed) {
    const weight = Math.max(0, roundTo(load - bump, bump));
    return {
      weight,
      reps: TARGET_REPS,
      action: 'reduce',
      increment: bump,
      reason: `Top set only hit ${top.reps} at ${fmt(load, unit)}. Drop ${fmt(bump, unit)} and own ${TARGET_REPS} to failure.`,
    };
  }

  if (top.reps >= TARGET_REPS && laterOk) {
    if (dropHeavy) {
      return {
        weight: load,
        reps: TARGET_REPS,
        action: 'hold',
        increment: bump,
        reason: `Hit ${top.reps} with dropsets at ${fmt(load, unit)}. Repeat the top load for 2–3 hard sets before adding.`,
      };
    }
    return {
      weight: roundTo(load + bump, bump),
      reps: TARGET_REPS,
      action: 'increase',
      increment: bump,
      reason: `Hit ${top.reps} to failure at ${fmt(load, unit)}. Next: ${fmt(roundTo(load + bump, bump), unit)} × ${TARGET_REPS}, 2–3 hard sets.`,
    };
  }

  return {
    weight: load,
    reps: TARGET_REPS,
    action: 'hold',
    increment: bump,
    reason: `Top set was ${fmt(load, unit)} × ${top.reps}. Hold and chase ${TARGET_REPS} to failure (2–3 sets).`,
  };
}

export function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

export function fmt(n: number, unit: Unit): string {
  const shown = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return `${shown} ${unit}`;
}

export function formatSetLine(set: LoggedSet, unit: Unit): string {
  const tags: string[] = [];
  if (set.warmup) tags.push('WU');
  if (set.toFailure) tags.push('F');
  if (set.dropset) tags.push('drop');
  if (set.emphasis === 'stretch') tags.push('stretch');
  if (set.emphasis === 'contraction') tags.push('squeeze');
  const extra =
    set.dropset && set.drops?.length
      ? ` → ${set.drops.map((d) => `${d.weight}×${d.reps}`).join(' → ')}`
      : '';
  return `${set.weight}${unit}×${set.reps}${tags.length ? ` ${tags.join(' ')}` : ''}${extra}`;
}

export function bestForGoal(
  workouts: Workout[],
  exerciseId: string,
): { weight: number; reps: number } | undefined {
  const hist = workingLoadHistory(workouts, exerciseId);
  if (!hist.length) return undefined;
  return hist.reduce((best, row) =>
    row.weight > best.weight || (row.weight === best.weight && row.reps > best.reps)
      ? row
      : best,
  );
}

export function exerciseById(
  catalog: CatalogExercise[],
  id: string,
): CatalogExercise | undefined {
  return catalog.find((e) => e.id === id);
}

export function buildDefaultSet(args: {
  last?: LoggedSet;
  lastWorking?: LoggedSet;
  suggestion?: OverloadSuggestion;
  priorWorking?: LoggedSet;
  partial?: Partial<LoggedSet>;
  now?: number;
  id: string;
}): LoggedSet {
  const { last, lastWorking, suggestion, priorWorking, partial, id } = args;
  const warmup = partial?.warmup ?? false;
  const source = lastWorking ?? last;
  return {
    id,
    weight:
      partial?.weight ??
      lastWorking?.weight ??
      suggestion?.weight ??
      priorWorking?.weight ??
      last?.weight ??
      0,
    reps:
      partial?.reps ??
      lastWorking?.reps ??
      suggestion?.reps ??
      priorWorking?.reps ??
      last?.reps ??
      TARGET_REPS,
    rpe: partial?.rpe ?? null,
    notes: partial?.notes ?? '',
    warmup,
    completedAt: args.now ?? Date.now(),
    toFailure: partial?.toFailure ?? (warmup ? undefined : true),
    dropset: partial?.dropset ?? false,
    drops: partial?.drops,
    emphasis: partial?.emphasis ?? source?.emphasis ?? null,
  };
}
