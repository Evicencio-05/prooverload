import type { CatalogExercise, LoggedSet, Workout } from '../types';

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

export function suggestNextLoad(
  lastSets: LoggedSet[],
  unit: 'kg' | 'lb',
): { weight: number; reason: string } | undefined {
  const w = workingSets(lastSets);
  if (!w.length) return undefined;
  const top = topWorkingSet(w)!;
  const bump = unit === 'kg' ? 2.5 : 5;
  const allHit = w.every((s) => s.reps >= 8);
  if (allHit && w.length >= 2) {
    return {
      weight: roundTo(top.weight + bump, bump),
      reason: `Last working sets were all 8+ reps at ${fmt(top.weight, unit)}. Add ${fmt(bump, unit)}.`,
    };
  }
  if (top.reps >= 12) {
    return {
      weight: roundTo(top.weight + bump, bump),
      reason: `Top set hit ${top.reps} reps. Time to add ${fmt(bump, unit)}.`,
    };
  }
  return {
    weight: top.weight,
    reason: `Repeat ${fmt(top.weight, unit)} × ${top.reps} and chase one more clean rep.`,
  };
}

export function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

export function fmt(n: number, unit: 'kg' | 'lb'): string {
  const shown = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return `${shown} ${unit}`;
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
