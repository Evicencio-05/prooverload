import { catalogMuscleIds, MUSCLES, remapMuscleIds } from '../data/muscles';
import type { CatalogExercise, MuscleId, Workout } from '../types';

export type MuscleStat = {
  id: MuscleId;
  label: string;
  region: string;
  sets: number;
  volume: number;
  lastTrainedAt: number | null;
  daysAgo: number | null;
};

export type BodyAnalysis = {
  windowDays: number;
  stats: MuscleStat[];
  underworked: MuscleStat[];
  explanation: string[];
};

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function analyzeBody(
  workouts: Workout[],
  catalog: CatalogExercise[],
  now = Date.now(),
): BodyAnalysis {
  const byId = new Map(catalog.map((e) => [e.id, e]));
  const stats = new Map<MuscleId, MuscleStat>();
  for (const m of MUSCLES) {
    stats.set(m.id, {
      id: m.id,
      label: m.label,
      region: m.region,
      sets: 0,
      volume: 0,
      lastTrainedAt: null,
      daysAgo: null,
    });
  }

  const since = now - WINDOW_MS;
  for (const w of workouts) {
    for (const block of w.exercises) {
      const ex = byId.get(block.exerciseId);
      if (!ex) continue;
      for (const set of block.sets) {
        if (set.warmup) continue;
        const vol = set.weight * set.reps;
        const apply = (id: MuscleId, factor: number) => {
          const s = stats.get(id);
          if (!s) return;
          if (set.completedAt >= since) {
            s.sets += factor;
            s.volume += vol * factor;
          }
          if (s.lastTrainedAt === null || set.completedAt > s.lastTrainedAt) {
            s.lastTrainedAt = set.completedAt;
          }
        };
        for (const id of remapMuscleIds(ex.primary)) apply(id, 1);
        for (const id of remapMuscleIds(ex.secondary)) apply(id, 0.5);
      }
    }
  }

  const list = [...stats.values()].map((s) => ({
    ...s,
    daysAgo: s.lastTrainedAt === null ? null : Math.floor((now - s.lastTrainedAt) / 86400000),
  }));

  const trained = list.filter((s) => s.volume > 0);
  const median =
    trained.length === 0
      ? 0
      : [...trained].sort((a, b) => a.volume - b.volume)[Math.floor(trained.length / 2)]
          .volume;

  const mapped = catalogMuscleIds(catalog);
  const underworked = list.filter((s) => {
    if (!mapped.has(s.id)) return false;
    const stale = s.daysAgo === null || s.daysAgo >= 5;
    const light = trained.length >= 4 && s.volume < median * 0.4;
    return stale || light;
  });

  const explanation: string[] = [
    'Coverage is estimated from your logged working sets in the last 7 days. Primary muscles get full volume; secondary muscles get half. This is training-volume guidance only — not a medical assessment.',
  ];
  if (!trained.length) {
    explanation.push('No working sets in the last week yet. Finish a session and this map will fill in from that history.');
  } else {
    explanation.push(
      `This week’s busiest tissues: ${[...trained]
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 3)
        .map((s) => s.label)
        .join(', ')}.`,
    );
    if (underworked.length) {
      explanation.push(
        `Underworked vs your own week: ${underworked
          .slice(0, 6)
          .map((s) => `${s.label}${s.daysAgo === null ? ' (no working sets on record)' : ` (${s.daysAgo}d ago)`}`)
          .join(', ')}.`,
      );
    }
  }

  return { windowDays: 7, stats: list, underworked, explanation };
}

export function suggestExercisesFor(
  muscles: MuscleId[],
  catalog: CatalogExercise[],
  limit = 4,
): CatalogExercise[] {
  const wanted = new Set(muscles);
  const scored = catalog
    .map((ex) => {
      const primaryHits = remapMuscleIds(ex.primary).filter((m) => wanted.has(m)).length;
      const secondaryHits = remapMuscleIds(ex.secondary).filter((m) => wanted.has(m)).length;
      return { ex, score: primaryHits * 2 + secondaryHits };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: CatalogExercise[] = [];
  for (const row of scored) {
    if (seen.has(row.ex.id)) continue;
    seen.add(row.ex.id);
    out.push(row.ex);
    if (out.length >= limit) break;
  }
  return out;
}
