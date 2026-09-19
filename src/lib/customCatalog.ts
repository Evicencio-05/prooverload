import type { CatalogExercise, MuscleId } from '../types';

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
  { test: /sissy/, primary: 'quads', secondary: [], bodyweight: true },
  { test: /calf/, primary: 'calves', secondary: [] },
  { test: /\brdl\b|romanian|hamstring|leg curl|good morning/, primary: 'hamstrings', secondary: ['glutes'] },
  { test: /deadlift/, primary: 'hamstrings', secondary: ['glutes', 'lower_back'] },
  { test: /hip thrust|glute bridge|hip abduct|glute/, primary: 'glutes', secondary: [] },
  { test: /adduct/, primary: 'adductors', secondary: [] },
  { test: /squat|lunge|leg press|leg extension|quad|step-?up/, primary: 'quads', secondary: ['glutes'] },
  { test: /push-?up|bench|chest|pec|\bflys?\b/, primary: 'chest', secondary: ['front_delts', 'triceps'] },
  { test: /face ?pull|rear delt|reverse pec/, primary: 'rear_delts', secondary: ['upper_back'] },
  { test: /pull-?up|chin-?up|pulldown|\blats?\b/, primary: 'lats', secondary: ['biceps'] },
  { test: /\brows?\b/, primary: 'lats', secondary: ['upper_back', 'biceps'] },
  { test: /shrug/, primary: 'traps', secondary: [] },
  { test: /lateral|side delt/, primary: 'side_delts', secondary: [] },
  { test: /overhead|\bohp\b|military|shoulder press|front raise|arnold/, primary: 'front_delts', secondary: ['triceps'] },
  { test: /tricep|skull|pushdown|close-?grip/, primary: 'triceps', secondary: [] },
  { test: /bicep|\bcurls?\b/, primary: 'biceps', secondary: ['forearms'] },
  { test: /wrist|forearm|farmer/, primary: 'forearms', secondary: [] },
  { test: /pallof|oblique/, primary: 'obliques', secondary: ['abs'] },
  { test: /plank|crunch|ab wheel|leg raise|\babs\b/, primary: 'abs', secondary: [] },
  { test: /back extension|lower back/, primary: 'lower_back', secondary: [] },
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
  return { equipment, primary: 'chest', secondary: [], confident: false };
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
