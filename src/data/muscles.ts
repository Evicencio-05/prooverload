import type { CatalogExercise, LegacyMuscleId, MuscleId, MuscleRegion } from '../types';

export type MuscleMeta = {
  id: MuscleId;
  label: string;
  region: MuscleRegion;
};

export const MUSCLE_REGIONS: MuscleRegion[] = ['Push', 'Pull', 'Core', 'Legs'];

export const MUSCLES: MuscleMeta[] = [
  { id: 'pectoralis_clavicular', label: 'Pectoralis major, clavicular', region: 'Push' },
  { id: 'pectoralis_sternal', label: 'Pectoralis major, sternal', region: 'Push' },
  { id: 'pectoralis_costal', label: 'Pectoralis major, costal', region: 'Push' },
  { id: 'serratus_anterior', label: 'Serratus anterior', region: 'Push' },
  { id: 'anterior_deltoid', label: 'Anterior deltoid', region: 'Push' },
  { id: 'lateral_deltoid', label: 'Lateral deltoid', region: 'Push' },
  { id: 'triceps_long', label: 'Triceps brachii, long head', region: 'Push' },
  { id: 'triceps_lateral', label: 'Triceps brachii, lateral head', region: 'Push' },
  { id: 'triceps_medial', label: 'Triceps brachii, medial head', region: 'Push' },

  { id: 'posterior_deltoid', label: 'Posterior deltoid', region: 'Pull' },
  { id: 'trapezius_upper', label: 'Trapezius, upper', region: 'Pull' },
  { id: 'trapezius_mid', label: 'Trapezius, middle', region: 'Pull' },
  { id: 'trapezius_lower', label: 'Trapezius, lower', region: 'Pull' },
  { id: 'rhomboids', label: 'Rhomboids', region: 'Pull' },
  { id: 'latissimus_dorsi', label: 'Latissimus dorsi', region: 'Pull' },
  { id: 'teres_major', label: 'Teres major', region: 'Pull' },
  { id: 'rotator_cuff', label: 'Rotator cuff (infra / teres minor)', region: 'Pull' },
  { id: 'biceps_brachii', label: 'Biceps brachii', region: 'Pull' },
  { id: 'brachialis', label: 'Brachialis', region: 'Pull' },
  { id: 'brachioradialis', label: 'Brachioradialis', region: 'Pull' },
  { id: 'wrist_flexors', label: 'Wrist flexors', region: 'Pull' },
  { id: 'wrist_extensors', label: 'Wrist extensors', region: 'Pull' },

  { id: 'sternocleidomastoid', label: 'Sternocleidomastoid', region: 'Core' },
  { id: 'rectus_abdominis', label: 'Rectus abdominis', region: 'Core' },
  { id: 'obliques', label: 'Obliques', region: 'Core' },
  { id: 'iliopsoas', label: 'Iliopsoas', region: 'Core' },
  { id: 'erector_spinae', label: 'Erector spinae', region: 'Core' },

  { id: 'gluteus_maximus', label: 'Gluteus maximus', region: 'Legs' },
  { id: 'gluteus_medius', label: 'Gluteus medius', region: 'Legs' },
  { id: 'rectus_femoris', label: 'Rectus femoris', region: 'Legs' },
  { id: 'vastus_lateralis', label: 'Vastus lateralis', region: 'Legs' },
  { id: 'vastus_medialis', label: 'Vastus medialis', region: 'Legs' },
  { id: 'biceps_femoris', label: 'Biceps femoris', region: 'Legs' },
  { id: 'semitendinosus', label: 'Semitendinosus / semimembranosus', region: 'Legs' },
  { id: 'adductors', label: 'Adductors', region: 'Legs' },
  { id: 'gastrocnemius', label: 'Gastrocnemius', region: 'Legs' },
  { id: 'soleus', label: 'Soleus', region: 'Legs' },
  { id: 'tibialis_anterior', label: 'Tibialis anterior', region: 'Legs' },
];

export const MUSCLE_LABEL: Record<MuscleId, string> = Object.fromEntries(
  MUSCLES.map((m) => [m.id, m.label]),
) as Record<MuscleId, string>;

export const MUSCLE_ID_SET: ReadonlySet<MuscleId> = new Set(MUSCLES.map((m) => m.id));

export const DEFAULT_MUSCLE_ID: MuscleId = 'pectoralis_sternal';

/**
 * Phase 1 coarse ids → current visualizable tissues.
 * Composite tags expand so old customs still paint the whole region.
 */
export const LEGACY_MUSCLE_MAP: Record<LegacyMuscleId, MuscleId[]> = {
  chest: ['pectoralis_clavicular', 'pectoralis_sternal', 'pectoralis_costal'],
  upper_back: ['rhomboids', 'trapezius_mid'],
  lats: ['latissimus_dorsi'],
  traps: ['trapezius_upper', 'trapezius_mid', 'trapezius_lower'],
  lower_back: ['erector_spinae'],
  front_delts: ['anterior_deltoid'],
  side_delts: ['lateral_deltoid'],
  rear_delts: ['posterior_deltoid'],
  biceps: ['biceps_brachii'],
  triceps: ['triceps_long', 'triceps_lateral', 'triceps_medial'],
  forearms: ['brachioradialis', 'wrist_flexors', 'wrist_extensors'],
  abs: ['rectus_abdominis'],
  glutes: ['gluteus_maximus', 'gluteus_medius'],
  quads: ['rectus_femoris', 'vastus_lateralis', 'vastus_medialis'],
  hamstrings: ['biceps_femoris', 'semitendinosus'],
  calves: ['gastrocnemius', 'soleus'],
};

export function isMuscleId(id: string): id is MuscleId {
  return MUSCLE_ID_SET.has(id as MuscleId);
}

/** Expand one stored id (current or legacy) into current MuscleIds. */
export function remapMuscleId(id: string): MuscleId[] {
  if (isMuscleId(id)) return [id];
  return (LEGACY_MUSCLE_MAP as Record<string, MuscleId[]>)[id] ?? [];
}

export function remapMuscleIds(ids: readonly string[] | undefined | null): MuscleId[] {
  const out: MuscleId[] = [];
  const seen = new Set<MuscleId>();
  for (const raw of ids ?? []) {
    if (typeof raw !== 'string' || !raw.trim()) continue;
    for (const id of remapMuscleId(raw.trim())) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

export function normalizeCatalogExercise<T extends { primary?: string[]; secondary?: string[] }>(
  ex: T,
): T & { primary: MuscleId[]; secondary: MuscleId[] } {
  const primary = remapMuscleIds(ex.primary);
  const secondary = remapMuscleIds(ex.secondary).filter((id) => !primary.includes(id));
  return { ...ex, primary, secondary };
}

export function muscleLabel(id: string): string {
  const mapped = remapMuscleId(id);
  if (!mapped.length) return id;
  return mapped.map((m) => MUSCLE_LABEL[m]).join(', ');
}

export function formatMuscleList(ids: readonly string[] | undefined | null): string {
  return remapMuscleIds(ids)
    .map((id) => MUSCLE_LABEL[id])
    .join(', ');
}

export function musclesByRegion(): { region: MuscleRegion; muscles: MuscleMeta[] }[] {
  return MUSCLE_REGIONS.map((region) => ({
    region,
    muscles: MUSCLES.filter((m) => m.region === region),
  }));
}

export function catalogUsesOnlyCurrentIds(ex: CatalogExercise): boolean {
  return [...ex.primary, ...ex.secondary].every(isMuscleId);
}

/** Tissues the static catalog may omit until a real common lift is added. */
export const CATALOG_OPTIONAL_MUSCLES: readonly MuscleId[] = ['sternocleidomastoid'];

export function exerciseMuscleIds(ex: { primary?: string[]; secondary?: string[] }): MuscleId[] {
  return remapMuscleIds([...(ex.primary ?? []), ...(ex.secondary ?? [])]);
}

export function catalogMuscleIds(catalog: readonly { primary?: string[]; secondary?: string[] }[]): Set<MuscleId> {
  const covered = new Set<MuscleId>();
  for (const ex of catalog) {
    for (const id of exerciseMuscleIds(ex)) covered.add(id);
  }
  return covered;
}

export function coversLegacyGroup(
  ex: { primary?: string[]; secondary?: string[] },
  legacy: LegacyMuscleId,
): boolean {
  const hits = new Set(exerciseMuscleIds(ex));
  return LEGACY_MUSCLE_MAP[legacy].every((id) => hits.has(id));
}
