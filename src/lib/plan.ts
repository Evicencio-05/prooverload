import type { PlannedExercise, SetEmphasis, Workout, WorkoutExercise } from '../types';

export const DEFAULT_WORKING_SETS = 2;
export const MIN_WORKING_SETS = 1;
export const MAX_WORKING_SETS = 5;

export function clampWorkingSets(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_WORKING_SETS;
  return Math.min(MAX_WORKING_SETS, Math.max(MIN_WORKING_SETS, Math.round(n)));
}

export function workingSetCount(block: WorkoutExercise): number {
  return block.sets.filter((s) => !s.warmup).length;
}

export function pendingPlan(workout: Workout): PlannedExercise[] {
  const logged = new Set(workout.exercises.map((e) => e.exerciseId));
  return (workout.plan ?? []).filter((item) => !logged.has(item.exerciseId));
}

export function addMovementToPlan(
  workout: Workout,
  exerciseId: string,
  opts: { id: string; targetWorkingSets?: number; emphasis?: SetEmphasis | null },
): Workout {
  const targetWorkingSets = clampWorkingSets(opts.targetWorkingSets ?? DEFAULT_WORKING_SETS);
  const emphasis = opts.emphasis ?? null;
  const existingBlock = workout.exercises.find((e) => e.exerciseId === exerciseId);
  if (existingBlock) {
    return {
      ...workout,
      exercises: workout.exercises.map((e) =>
        e.id === existingBlock.id ? { ...e, targetWorkingSets, plannedEmphasis: emphasis } : e,
      ),
    };
  }
  const existingPlan = (workout.plan ?? []).find((p) => p.exerciseId === exerciseId);
  if (existingPlan) {
    return {
      ...workout,
      plan: (workout.plan ?? []).map((p) =>
        p.id === existingPlan.id ? { ...p, targetWorkingSets, emphasis } : p,
      ),
    };
  }
  const item: PlannedExercise = {
    id: opts.id,
    exerciseId,
    targetWorkingSets,
    emphasis,
  };
  return { ...workout, plan: [...(workout.plan ?? []), item] };
}

export function updatePlanItem(
  workout: Workout,
  planId: string,
  patch: Partial<Pick<PlannedExercise, 'targetWorkingSets' | 'emphasis'>>,
): Workout {
  return {
    ...workout,
    plan: (workout.plan ?? []).map((p) => {
      if (p.id !== planId) return p;
      return {
        ...p,
        ...patch,
        targetWorkingSets: clampWorkingSets(patch.targetWorkingSets ?? p.targetWorkingSets),
      };
    }),
  };
}

export function removePlanItem(workout: Workout, planId: string): Workout {
  return { ...workout, plan: (workout.plan ?? []).filter((p) => p.id !== planId) };
}

/** Start a planned movement: copy targets onto the new block and drop it from the queue. */
export function consumePlanForExercise(
  workout: Workout,
  exerciseId: string,
): { targetWorkingSets?: number; plannedEmphasis?: SetEmphasis | null; plan: PlannedExercise[] } {
  const item = (workout.plan ?? []).find((p) => p.exerciseId === exerciseId);
  const plan = (workout.plan ?? []).filter((p) => p.exerciseId !== exerciseId);
  return {
    targetWorkingSets: item?.targetWorkingSets,
    plannedEmphasis: item?.emphasis ?? null,
    plan,
  };
}
