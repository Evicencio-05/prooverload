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
    <path
      d={d}
      fill={fill}
      stroke="#101418"
      strokeWidth="0.65"
      strokeLinejoin="round"
    >
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
        strokeWidth="0.65"
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
        <ellipse cx="100" cy="26" rx="18" ry="22" fill="#3a444c" />
        <Region id="sternocleidomastoid" fill={paint('sternocleidomastoid')} mirror d="M88 46 C94 44 98 50 96 58 L90 66 C84 62 84 50 88 46 Z" />
        <Region id="trapezius_upper" fill={paint('trapezius_upper')} mirror d="M68 54 C78 48 88 50 90 60 L84 70 C74 68 64 62 68 54 Z" />
        <Region id="lateral_deltoid" fill={paint('lateral_deltoid')} mirror d="M36 82 C44 68 56 70 54 92 L48 128 C36 118 30 96 36 82 Z" />
        <Region id="anterior_deltoid" fill={paint('anterior_deltoid')} mirror d="M52 78 C64 66 76 74 80 108 L70 136 C56 122 44 98 52 78 Z" />
        <Region id="pectoralis_clavicular" fill={paint('pectoralis_clavicular')} mirror d="M78 78 C86 70 98 72 100 76 L100 108 C94 110 84 112 80 108 Z" />
        <Region id="pectoralis_sternal" fill={paint('pectoralis_sternal')} mirror d="M80 108 C86 110 96 110 100 108 L100 144 C94 146 84 148 78 144 Z" />
        <Region id="pectoralis_costal" fill={paint('pectoralis_costal')} mirror d="M78 144 C86 148 96 146 100 144 L100 166 C92 168 84 166 80 162 Z" />
        <Region id="serratus_anterior" fill={paint('serratus_anterior')} mirror d="M68 128 C78 132 82 148 80 168 L70 176 C62 160 60 138 68 128 Z" />
        <Region id="biceps_brachii" fill={paint('biceps_brachii')} mirror d="M40 118 C50 112 60 122 58 150 L54 180 C44 176 36 150 40 118 Z" />
        <Region id="brachialis" fill={paint('brachialis')} mirror d="M56 132 C64 128 68 140 66 164 L60 182 C54 178 52 150 56 132 Z" />
        <Region id="brachioradialis" fill={paint('brachioradialis')} mirror d="M34 176 C46 172 54 184 50 210 L44 230 C34 226 28 196 34 176 Z" />
        <Region id="wrist_flexors" fill={paint('wrist_flexors')} mirror d="M28 226 C40 222 48 232 44 250 L38 268 C28 264 24 240 28 226 Z" />
        <Region id="rectus_abdominis" fill={paint('rectus_abdominis')} d="M86 166 C96 164 104 164 114 166 L110 228 C104 230 96 230 90 228 Z" />
        <Region id="obliques" fill={paint('obliques')} mirror d="M70 168 C82 172 86 186 88 220 L70 218 C64 198 62 176 70 168 Z" />
        <Region id="iliopsoas" fill={paint('iliopsoas')} mirror d="M80 220 C90 222 98 228 96 246 L84 252 C76 240 74 226 80 220 Z" />
        <Region id="vastus_lateralis" fill={paint('vastus_lateralis')} mirror d="M64 228 C74 224 82 236 80 280 L76 322 C64 318 58 270 64 228 Z" />
        <Region id="rectus_femoris" fill={paint('rectus_femoris')} mirror d="M80 230 C90 226 98 234 96 286 L92 318 C84 320 78 270 80 230 Z" />
        <Region id="vastus_medialis" fill={paint('vastus_medialis')} mirror d="M82 278 C92 276 100 286 98 310 L94 332 C84 334 78 300 82 278 Z" />
        <Region id="tibialis_anterior" fill={paint('tibialis_anterior')} mirror d="M72 332 C84 330 90 344 88 372 L84 392 C74 390 68 356 72 332 Z" />
        <Region id="gastrocnemius" fill={paint('gastrocnemius')} mirror d="M64 336 C70 334 74 348 72 372 L66 380 C60 368 58 346 64 336 Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 200 420" className="body-svg" role="img" aria-label="Back muscle map">
      <ellipse cx="100" cy="26" rx="18" ry="22" fill="#3a444c" />
      <Region id="trapezius_upper" fill={paint('trapezius_upper')} d="M68 52 C80 44 120 44 132 52 L148 80 C120 70 80 70 52 80 Z" />
      <Region id="sternocleidomastoid" fill={paint('sternocleidomastoid')} mirror d="M90 46 C96 44 100 50 98 58 L94 64 C88 62 86 50 90 46 Z" />
      <Region id="posterior_deltoid" fill={paint('posterior_deltoid')} mirror d="M46 80 C64 66 76 80 80 118 L66 148 C48 132 38 104 46 80 Z" />
      <Region id="lateral_deltoid" fill={paint('lateral_deltoid')} mirror d="M34 84 C42 70 52 74 50 98 L44 126 C34 118 28 98 34 84 Z" />
      <Region id="trapezius_mid" fill={paint('trapezius_mid')} d="M86 78 C96 74 104 74 114 78 L118 116 C110 120 90 120 82 116 Z" />
      <Region id="rhomboids" fill={paint('rhomboids')} mirror d="M82 98 C90 94 98 100 98 124 L90 140 C80 132 76 110 82 98 Z" />
      <Region id="rotator_cuff" fill={paint('rotator_cuff')} mirror d="M72 96 C84 90 92 100 90 126 L80 142 C68 134 64 110 72 96 Z" />
      <Region id="teres_major" fill={paint('teres_major')} mirror d="M66 128 C76 122 86 130 84 148 L74 160 C64 152 60 136 66 128 Z" />
      <Region id="trapezius_lower" fill={paint('trapezius_lower')} d="M90 118 C100 116 110 116 110 118 L106 170 C102 176 98 176 94 170 Z" />
      <Region id="latissimus_dorsi" fill={paint('latissimus_dorsi')} mirror d="M56 118 C72 110 88 128 86 168 L76 202 C58 188 46 148 56 118 Z" />
      <Region id="triceps_lateral" fill={paint('triceps_lateral')} mirror d="M30 118 C40 110 48 124 46 158 L40 178 C30 174 26 140 30 118 Z" />
      <Region id="triceps_long" fill={paint('triceps_long')} mirror d="M42 122 C52 116 60 128 58 160 L52 188 C42 184 36 148 42 122 Z" />
      <Region id="triceps_medial" fill={paint('triceps_medial')} mirror d="M36 168 C48 164 54 172 52 186 L46 198 C36 196 30 180 36 168 Z" />
      <Region id="wrist_extensors" fill={paint('wrist_extensors')} mirror d="M28 186 C40 182 48 192 44 226 L38 258 C28 254 24 210 28 186 Z" />
      <Region id="erector_spinae" fill={paint('erector_spinae')} d="M90 172 C100 170 110 170 110 172 L108 228 C104 232 96 232 92 228 Z" />
      <Region id="gluteus_medius" fill={paint('gluteus_medius')} mirror d="M64 220 C76 214 88 220 86 244 L74 250 C62 242 58 228 64 220 Z" />
      <Region id="gluteus_maximus" fill={paint('gluteus_maximus')} mirror d="M70 234 C84 228 99 232 100 248 L100 280 C88 286 74 282 68 268 Z" />
      <Region id="biceps_femoris" fill={paint('biceps_femoris')} mirror d="M68 276 C80 272 88 284 86 320 L80 348 C68 344 62 310 68 276 Z" />
      <Region id="semitendinosus" fill={paint('semitendinosus')} mirror d="M86 278 C96 274 102 286 100 320 L96 348 C88 350 82 310 86 278 Z" />
      <Region id="adductors" fill={paint('adductors')} mirror d="M90 282 C98 280 104 292 102 324 L96 342 C90 344 86 310 90 282 Z" />
      <Region id="gastrocnemius" fill={paint('gastrocnemius')} mirror d="M68 344 C82 340 94 350 92 372 L86 384 C74 386 64 366 68 344 Z" />
      <Region id="soleus" fill={paint('soleus')} mirror d="M66 372 C80 368 92 378 90 396 L84 408 C72 410 62 390 66 372 Z" />
    </svg>
  );
}
