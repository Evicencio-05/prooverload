import type { MuscleId } from '../types';
import type { MuscleStat } from '../lib/bodyAnalysis';

function fillFor(stat: MuscleStat | undefined): string {
  if (!stat) return '#2a3238';
  if (stat.daysAgo === null) return '#2a3238';
  if (stat.daysAgo <= 1 && stat.volume > 0) return '#7dffb3';
  if (stat.daysAgo <= 3 && stat.volume > 0) return '#3ecf8e';
  if (stat.daysAgo <= 5) return '#c9a227';
  return '#6b3a3a';
}

export function MuscleMap({
  stats,
  view,
}: {
  stats: MuscleStat[];
  view: 'front' | 'back';
}) {
  const get = (id: MuscleId) => stats.find((s) => s.id === id);
  if (view === 'front') {
    return (
      <svg viewBox="0 0 200 420" className="body-svg" role="img" aria-label="Front muscle map">
        <rect width="200" height="420" fill="transparent" />
        <ellipse cx="100" cy="28" rx="22" ry="26" fill="#3a444c" />
        <path d="M70 58 C70 48,130 48,130 58 L138 92 C120 86,80 86,62 92 Z" fill={fillFor(get('traps'))} />
        <path d="M48 88 C70 70,78 96,88 128 L70 168 C50 150,40 120,48 88 Z" fill={fillFor(get('front_delts'))} />
        <path d="M152 88 C130 70,122 96,112 128 L130 168 C150 150,160 120,152 88 Z" fill={fillFor(get('front_delts'))} />
        <path d="M88 96 H112 L118 168 H82 Z" fill={fillFor(get('chest'))} />
        <path d="M40 120 C52 130,58 160,54 190 L36 186 C32 150,34 128,40 120 Z" fill={fillFor(get('biceps'))} />
        <path d="M160 120 C148 130,142 160,146 190 L164 186 C168 150,166 128,160 120 Z" fill={fillFor(get('biceps'))} />
        <path d="M32 186 L54 192 L48 250 L28 244 Z" fill={fillFor(get('forearms'))} />
        <path d="M168 186 L146 192 L152 250 L172 244 Z" fill={fillFor(get('forearms'))} />
        <path d="M82 168 H118 L114 220 H86 Z" fill={fillFor(get('abs'))} />
        <path d="M70 170 L82 176 L86 220 L68 214 Z" fill={fillFor(get('obliques'))} />
        <path d="M130 170 L118 176 L114 220 L132 214 Z" fill={fillFor(get('obliques'))} />
        <path d="M72 220 H100 L96 330 H68 Z" fill={fillFor(get('quads'))} />
        <path d="M100 220 H128 L132 330 H104 Z" fill={fillFor(get('quads'))} />
        <path d="M70 328 L96 332 L94 390 L68 384 Z" fill={fillFor(get('calves'))} />
        <path d="M104 328 L130 332 L132 384 L106 390 Z" fill={fillFor(get('calves'))} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 420" className="body-svg" role="img" aria-label="Back muscle map">
      <ellipse cx="100" cy="28" rx="22" ry="26" fill="#3a444c" />
      <path d="M68 56 C78 48,122 48,132 56 L148 88 C120 78,80 78,52 88 Z" fill={fillFor(get('traps'))} />
      <path d="M48 88 C70 70,78 100,84 130 L66 170 C46 150,38 118,48 88 Z" fill={fillFor(get('rear_delts'))} />
      <path d="M152 88 C130 70,122 100,116 130 L134 170 C154 150,162 118,152 88 Z" fill={fillFor(get('rear_delts'))} />
      <path d="M84 92 H116 L122 150 H78 Z" fill={fillFor(get('upper_back'))} />
      <path d="M78 148 H122 L118 200 H82 Z" fill={fillFor(get('lats'))} />
      <path d="M82 198 H118 L112 230 H88 Z" fill={fillFor(get('lower_back'))} />
      <path d="M40 122 C54 134,58 164,52 196 L34 190 C30 150,32 130,40 122 Z" fill={fillFor(get('triceps'))} />
      <path d="M160 122 C146 134,142 164,148 196 L166 190 C170 150,168 130,160 122 Z" fill={fillFor(get('triceps'))} />
      <path d="M70 228 H100 L108 280 H74 Z" fill={fillFor(get('glutes'))} />
      <path d="M100 228 H130 L126 280 H92 Z" fill={fillFor(get('glutes'))} />
      <path d="M74 278 H100 L96 340 H70 Z" fill={fillFor(get('hamstrings'))} />
      <path d="M100 278 H126 L130 340 H104 Z" fill={fillFor(get('hamstrings'))} />
      <path d="M88 300 H112 L110 338 H90 Z" fill={fillFor(get('adductors'))} />
      <path d="M70 338 L96 342 L94 398 L68 392 Z" fill={fillFor(get('calves'))} />
      <path d="M104 338 L130 342 L132 392 L106 398 Z" fill={fillFor(get('calves'))} />
    </svg>
  );
}
