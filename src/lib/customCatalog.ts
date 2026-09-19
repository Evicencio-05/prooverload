import type { CatalogExercise, MuscleId } from '../types';

const FALLBACK_MUSCLE: MuscleId = 'pectoralis_sternal';

export const EQUIPMENT_OPTIONS = [
  { id: 'barbell', label: 'Barbell' },
  { id: 'dumbbell', label: 'Dumbbell' },
  { id: 'machine', label: 'Machine' },
  { id: 'cable', label: 'Cable' },
  { id: 'bodyweight', label: 'Bodyweight' },
  { id: 'other', label: 'Other' },
] as const;

export type EquipmentId = (typeof EQUIPMENT_OPTIONS)[number]['id'];

const MUSCLE_RULES: { test: RegExp; primary: MuscleId; secondary: MuscleId[]; bodyweight?: boolean }[] = [
  { test: /sissy/, primary: 'rectus_femoris', secondary: ['vastus_medialis'], bodyweight: true },
  { test: /seated calf/, primary: 'soleus', secondary: [] },
  { test: /calf/, primary: 'gastrocnemius', secondary: ['soleus'] },
  { test: /\brdl\b|romanian|good morning/, primary: 'biceps_femoris', secondary: ['gluteus_maximus', 'erector_spinae'] },
  { test: /seated leg curl/, primary: 'semitendinosus', secondary: ['biceps_femoris'] },
  { test: /hamstring|leg curl/, primary: 'biceps_femoris', secondary: ['gastrocnemius'] },
  { test: /deadlift/, primary: 'gluteus_maximus', secondary: ['erector_spinae', 'biceps_femoris'] },
  { test: /hip thrust|glute bridge/, primary: 'gluteus_maximus', secondary: ['biceps_femoris'] },
  { test: /hip abduct|glute med/, primary: 'gluteus_medius', secondary: [] },
  { test: /glute/, primary: 'gluteus_maximus', secondary: [] },
  { test: /adduct/, primary: 'adductors', secondary: [] },
  { test: /leg extension/, primary: 'rectus_femoris', secondary: ['vastus_medialis'] },
  { test: /squat|lunge|leg press|quad|step-?up/, primary: 'vastus_lateralis', secondary: ['gluteus_maximus', 'rectus_femoris'] },
  { test: /incline.*curl/, primary: 'biceps_brachii', secondary: [] },
  { test: /incline/, primary: 'pectoralis_clavicular', secondary: ['anterior_deltoid', 'triceps_lateral'] },
  { test: /decline|chest dip/, primary: 'pectoralis_costal', secondary: ['triceps_long', 'anterior_deltoid'] },
  { test: /push-?up|bench|chest|pec|\bflys?\b/, primary: 'pectoralis_sternal', secondary: ['anterior_deltoid', 'triceps_lateral'] },
  { test: /face ?pull/, primary: 'posterior_deltoid', secondary: ['rotator_cuff', 'trapezius_upper'] },
  { test: /rear delt|reverse pec/, primary: 'posterior_deltoid', secondary: ['rhomboids'] },
  { test: /pull-?up|chin-?up|pulldown|\blats?\b/, primary: 'latissimus_dorsi', secondary: ['biceps_brachii', 'teres_major'] },
  { test: /\brows?\b/, primary: 'latissimus_dorsi', secondary: ['rhomboids', 'biceps_brachii'] },
  { test: /shrug/, primary: 'trapezius_upper', secondary: [] },
  { test: /lateral|side delt/, primary: 'lateral_deltoid', secondary: [] },
  { test: /overhead.*(tricep|extension)|french press/, primary: 'triceps_long', secondary: [] },
  { test: /overhead|\bohp\b|military|shoulder press|front raise|arnold/, primary: 'anterior_deltoid', secondary: ['triceps_lateral'] },
  { test: /tricep|skull|pushdown|close-?grip|\bdips?\b/, primary: 'triceps_lateral', secondary: [] },
  { test: /hammer/, primary: 'brachialis', secondary: ['brachioradialis'] },
  { test: /reverse curl/, primary: 'brachioradialis', secondary: ['biceps_brachii'] },
  { test: /bicep|\bcurls?\b/, primary: 'biceps_brachii', secondary: ['brachialis'] },
  { test: /wrist extensor|reverse wrist/, primary: 'wrist_extensors', secondary: [] },
  { test: /wrist|forearm|farmer/, primary: 'wrist_flexors', secondary: ['brachioradialis'] },
  { test: /pallof|oblique/, primary: 'obliques', secondary: ['rectus_abdominis'] },
  { test: /hanging|leg raise|hip flex|iliopsoas/, primary: 'iliopsoas', secondary: ['rectus_abdominis'] },
  { test: /plank|crunch|ab wheel|\babs\b/, primary: 'rectus_abdominis', secondary: [] },
  { test: /back extension|lower back|erector/, primary: 'erector_spinae', secondary: [] },
  { test: /neck|scm|sternocleid/, primary: 'sternocleidomastoid', secondary: [] },
  { test: /tibialis|shin/, primary: 'tibialis_anterior', secondary: [] },
  { test: /serratus/, primary: 'serratus_anterior', secondary: [] },
];

export function titleCaseExerciseName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      if (/^[A-Z0-9]{2,5}$/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function inferEquipment(query: string): EquipmentId {
  const s = query.toLowerCase();
  if (/\bbarbell\b/.test(s)) return 'barbell';
  if (/\bdumbbells?\b|\bdb\b/.test(s)) return 'dumbbell';
  if (/\bcable\b/.test(s)) return 'cable';
  if (/\bmachine\b|\bsmith\b/.test(s)) return 'machine';
  if (/\bbodyweight\b|\bbw\b/.test(s)) return 'bodyweight';
  return 'other';
}

export function inferCustomDefaults(query: string): {
  equipment: EquipmentId;
  primary: MuscleId;
  secondary: MuscleId[];
  confident: boolean;
} {
  const s = query.toLowerCase();
  let equipment = inferEquipment(query);
  for (const rule of MUSCLE_RULES) {
    if (!rule.test.test(s)) continue;
    if (equipment === 'other' && rule.bodyweight) equipment = 'bodyweight';
    return { equipment, primary: rule.primary, secondary: rule.secondary, confident: true };
  }
  return { equipment, primary: FALLBACK_MUSCLE, secondary: [], confident: false };
}

export function matchesNameOrAlias(ex: CatalogExercise, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (ex.name.toLowerCase().includes(q)) return true;
  return (ex.aliases ?? []).some((alias) => alias.toLowerCase().includes(q));
}

/** Name/alias hits count as useful. Equipment-only matches do not. */
export function hasUsefulCatalogHits(list: CatalogExercise[], query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  return list.some((ex) => matchesNameOrAlias(ex, q));
}

export function parseAliases(raw: string): string[] | undefined {
  const aliases = raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return aliases.length ? aliases : undefined;
}

export function findCustomByName(list: CatalogExercise[], name: string): CatalogExercise | undefined {
  const key = name.trim().toLowerCase();
  if (!key) return undefined;
  return list.find((ex) => ex.custom && ex.name.trim().toLowerCase() === key);
}

export function slugifyCatalogId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'custom-exercise';
}
