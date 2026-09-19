import type { MuscleId } from '../types';

export const MUSCLES: { id: MuscleId; label: string; region: string }[] = [
  { id: 'chest', label: 'Chest', region: 'Push' },
  { id: 'front_delts', label: 'Front delts', region: 'Push' },
  { id: 'side_delts', label: 'Side delts', region: 'Push' },
  { id: 'triceps', label: 'Triceps', region: 'Push' },
  { id: 'upper_back', label: 'Upper back', region: 'Pull' },
  { id: 'lats', label: 'Lats', region: 'Pull' },
  { id: 'traps', label: 'Traps', region: 'Pull' },
  { id: 'rear_delts', label: 'Rear delts', region: 'Pull' },
  { id: 'biceps', label: 'Biceps', region: 'Pull' },
  { id: 'forearms', label: 'Forearms', region: 'Pull' },
  { id: 'lower_back', label: 'Lower back', region: 'Core' },
  { id: 'abs', label: 'Abs', region: 'Core' },
  { id: 'obliques', label: 'Obliques', region: 'Core' },
  { id: 'quads', label: 'Quads', region: 'Legs' },
  { id: 'glutes', label: 'Glutes', region: 'Legs' },
  { id: 'hamstrings', label: 'Hamstrings', region: 'Legs' },
  { id: 'adductors', label: 'Adductors', region: 'Legs' },
  { id: 'calves', label: 'Calves', region: 'Legs' },
];

export const MUSCLE_LABEL: Record<MuscleId, string> = Object.fromEntries(
  MUSCLES.map((m) => [m.id, m.label]),
) as Record<MuscleId, string>;
