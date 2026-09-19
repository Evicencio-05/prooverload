import { MUSCLE_LABEL } from '../data/muscles';
import type { MuscleStat } from '../lib/bodyAnalysis';
import type { MuscleId } from '../types';

function fillFor(stat: MuscleStat | undefined): string {
  if (!stat) return '#2a3238';
  if (stat.daysAgo === null) return '#2a3238';
  if (stat.daysAgo <= 1 && stat.volume > 0) return '#7dffb3';
  if (stat.daysAgo <= 3 && stat.volume > 0) return '#3ecf8e';
  if (stat.daysAgo <= 5) return '#c9a227';
  return '#6b3a3a';
}

function Region({
  id,
  d,
  fill,
  mirror = false,
}: {
  id: MuscleId;
  d: string;
  fill: string;
  mirror?: boolean;
}) {
  const path = (
    <path d={d} fill={fill} stroke="#101418" strokeWidth="0.7" strokeLinejoin="round">
      <title>{MUSCLE_LABEL[id]}</title>
    </path>
  );
  if (!mirror) return path;
  return (
    <g>
      {path}
      <path
        d={d}
        fill={fill}
        stroke="#101418"
        strokeWidth="0.7"
        strokeLinejoin="round"
        transform="translate(200 0) scale(-1 1)"
      >
        <title>{MUSCLE_LABEL[id]}</title>
      </path>
    </g>
  );
}

export function MuscleMap({
  stats,
  view,
}: {
  stats: MuscleStat[];
  view: 'front' | 'back';
}) {
  const get = (id: MuscleId) => stats.find((s) => s.id === id);
  const paint = (id: MuscleId) => fillFor(get(id));

  if (view === 'front') {
    return (
      <svg viewBox="0 0 200 420" className="body-svg" role="img" aria-label="Front muscle map">
        <rect width="200" height="420" fill="transparent" />
        <ellipse cx="100" cy="28" rx="22" ry="26" fill="#3a444c" />
        <path d="M88 48 H112 L116 64 H84 Z" fill="#3a444c" />
        <Region id="sternocleidomastoid" fill={paint('sternocleidomastoid')} mirror d="M84 48 C90 46 96 50 94 60 L88 66 C82 60 80 50 84 48 Z" />
        <Region id="trapezius_upper" fill={paint('trapezius_upper')} d="M70 58 C70 48 130 48 130 58 L138 92 C120 86 80 86 62 92 Z" />
        <Region id="lateral_deltoid" fill={paint('lateral_deltoid')} mirror d="M48 88 C58 74 68 80 66 108 L58 148 C46 134 40 110 48 88 Z" />
        <Region id="anterior_deltoid" fill={paint('anterior_deltoid')} mirror d="M64 84 C74 70 82 92 88 128 L70 168 C62 148 58 118 64 84 Z" />
        <Region id="pectoralis_clavicular" fill={paint('pectoralis_clavicular')} d="M88 96 H112 L114 120 H86 Z" />
        <Region id="pectoralis_sternal" fill={paint('pectoralis_sternal')} d="M86 120 H114 L116 146 H84 Z" />
        <Region id="pectoralis_costal" fill={paint('pectoralis_costal')} d="M84 146 H116 L118 168 H82 Z" />
        <Region id="serratus_anterior" fill={paint('serratus_anterior')} mirror d="M68 132 L82 140 L80 168 L66 160 Z" />
        <Region id="biceps_brachii" fill={paint('biceps_brachii')} mirror d="M40 120 C50 128 54 156 50 186 L36 182 C34 150 34 128 40 120 Z" />
        <Region id="brachialis" fill={paint('brachialis')} mirror d="M52 132 C58 136 60 160 56 188 L48 186 C48 160 48 140 52 132 Z" />
        <Region id="brachioradialis" fill={paint('brachioradialis')} mirror d="M32 186 L54 192 L50 220 L30 214 Z" />
        <Region id="wrist_flexors" fill={paint('wrist_flexors')} mirror d="M30 214 L50 220 L48 250 L28 244 Z" />
        <Region id="rectus_abdominis" fill={paint('rectus_abdominis')} d="M86 168 H114 L110 220 H90 Z" />
        <Region id="obliques" fill={paint('obliques')} mirror d="M70 170 L86 176 L90 220 L68 214 Z" />
        <Region id="iliopsoas" fill={paint('iliopsoas')} mirror d="M82 216 L100 220 L96 242 L84 238 Z" />
        <Region id="vastus_lateralis" fill={paint('vastus_lateralis')} mirror d="M72 220 H84 L80 328 H68 Z" />
        <Region id="rectus_femoris" fill={paint('rectus_femoris')} mirror d="M84 220 H100 L96 292 H82 Z" />
        <Region id="vastus_medialis" fill={paint('vastus_medialis')} mirror d="M82 286 H96 L96 330 H80 Z" />
        <Region id="tibialis_anterior" fill={paint('tibialis_anterior')} mirror d="M74 328 L96 332 L92 390 L76 384 Z" />
        <Region id="gastrocnemius" fill={paint('gastrocnemius')} mirror d="M68 328 L76 330 L74 372 L66 366 Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 200 420" className="body-svg" role="img" aria-label="Back muscle map">
      <ellipse cx="100" cy="28" rx="22" ry="26" fill="#3a444c" />
      <path d="M88 48 H112 L116 64 H84 Z" fill="#3a444c" />
      <Region id="sternocleidomastoid" fill={paint('sternocleidomastoid')} mirror d="M86 48 C92 46 98 50 96 58 L90 64 C84 60 82 50 86 48 Z" />
      <Region id="trapezius_upper" fill={paint('trapezius_upper')} d="M68 56 C78 48 122 48 132 56 L148 88 C120 78 80 78 52 88 Z" />
      <Region id="lateral_deltoid" fill={paint('lateral_deltoid')} mirror d="M48 88 C56 74 64 80 62 108 L54 146 C44 132 38 110 48 88 Z" />
      <Region id="posterior_deltoid" fill={paint('posterior_deltoid')} mirror d="M60 86 C72 70 80 96 84 130 L66 170 C58 148 52 116 60 86 Z" />
      <Region id="trapezius_mid" fill={paint('trapezius_mid')} d="M86 92 H114 L116 122 H84 Z" />
      <Region id="rhomboids" fill={paint('rhomboids')} d="M82 120 H118 L116 142 H84 Z" />
      <Region id="rotator_cuff" fill={paint('rotator_cuff')} mirror d="M70 98 L86 104 L84 140 L68 128 Z" />
      <Region id="teres_major" fill={paint('teres_major')} mirror d="M72 138 L90 144 L88 162 L70 154 Z" />
      <Region id="trapezius_lower" fill={paint('trapezius_lower')} d="M90 140 H110 L108 176 H92 Z" />
      <Region id="latissimus_dorsi" fill={paint('latissimus_dorsi')} d="M78 156 H122 L118 200 H82 Z" />
      <Region id="triceps_lateral" fill={paint('triceps_lateral')} mirror d="M36 122 C44 118 50 140 48 168 L36 164 C32 142 32 128 36 122 Z" />
      <Region id="triceps_long" fill={paint('triceps_long')} mirror d="M46 126 C54 128 58 156 54 186 L42 182 C42 154 42 134 46 126 Z" />
      <Region id="triceps_medial" fill={paint('triceps_medial')} mirror d="M38 168 C50 166 54 180 50 196 L34 190 C32 176 34 170 38 168 Z" />
      <Region id="wrist_extensors" fill={paint('wrist_extensors')} mirror d="M32 188 L52 194 L48 250 L28 244 Z" />
      <Region id="erector_spinae" fill={paint('erector_spinae')} d="M88 198 H112 L108 230 H92 Z" />
      <Region id="gluteus_medius" fill={paint('gluteus_medius')} mirror d="M70 228 H90 L88 252 H68 Z" />
      <Region id="gluteus_maximus" fill={paint('gluteus_maximus')} mirror d="M70 248 H100 L108 280 H74 Z" />
      <Region id="biceps_femoris" fill={paint('biceps_femoris')} mirror d="M74 278 H88 L84 340 H70 Z" />
      <Region id="semitendinosus" fill={paint('semitendinosus')} mirror d="M88 278 H100 L96 340 H82 Z" />
      <Region id="adductors" fill={paint('adductors')} d="M88 300 H112 L110 338 H90 Z" />
      <Region id="gastrocnemius" fill={paint('gastrocnemius')} mirror d="M70 338 L96 342 L94 374 L70 370 Z" />
      <Region id="soleus" fill={paint('soleus')} mirror d="M70 368 L94 374 L94 398 L68 392 Z" />
    </svg>
  );
}
