import { useState } from 'react';
import { DEFAULT_MUSCLE_ID, normalizeCatalogExercise } from '../data/muscles';
import { EQUIPMENT_OPTIONS, inferCustomDefaults, parseAliases, titleCaseExerciseName } from '../lib/customCatalog';
import { useApp } from '../state/AppState';
import type { CatalogExercise, MuscleId } from '../types';
import { MuscleSelect, SecondaryMuscleChips } from './MuscleFields';

export function CustomExerciseForm({
  draft,
  submitLabel = 'Save & add',
  onSaved,
}: {
  draft?: Partial<CatalogExercise>;
  submitLabel?: string;
  onSaved: (ex: CatalogExercise) => void;
}) {
  const { saveCustomExercise } = useApp();
  const inferred = inferCustomDefaults(draft?.name ?? '');
  const normalizedDraft = draft
    ? normalizeCatalogExercise({
        primary: draft.primary ?? [inferred.primary],
        secondary: draft.secondary ?? inferred.secondary,
      })
    : null;
  const [name, setName] = useState(draft?.name ?? '');
  const [equipment, setEquipment] = useState(draft?.equipment ?? inferred.equipment);
  const remappedPrimary = normalizedDraft?.primary ?? [inferred.primary];
  const remappedSecondary = normalizedDraft?.secondary ?? inferred.secondary;
  const initialPrimary = remappedPrimary[0] ?? inferred.primary ?? DEFAULT_MUSCLE_ID;
  const [primary, setPrimary] = useState<MuscleId>(initialPrimary);
  const [secondary, setSecondary] = useState<MuscleId[]>(
    [...remappedPrimary.slice(1), ...remappedSecondary].filter((id) => id !== initialPrimary),
  );
  const [aliasText, setAliasText] = useState((draft?.aliases ?? []).join(', '));
  const [busy, setBusy] = useState(false);

  function toggleSecondary(id: MuscleId) {
    setSecondary((cur) => (cur.includes(id) ? cur.filter((m) => m !== id) : [...cur, id]));
  }

  return (
    <form
      className="stack custom-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const trimmed = titleCaseExerciseName(name);
        if (!trimmed || busy) return;
        setBusy(true);
        try {
          const aliases = parseAliases(aliasText);
          const ex = await saveCustomExercise({
            id: draft?.id,
            name: trimmed,
            equipment,
            primary: [primary],
            secondary: secondary.filter((m) => m !== primary),
            aliases,
            promoteRequestedAt: draft?.promoteRequestedAt,
            promoteStatus: draft?.promoteStatus,
            promoteNote: draft?.promoteNote,
          });
          onSaved(ex);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="lbl">
        Name
        <input
          placeholder="Sissy squat"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>
      <label className="lbl">
        Equipment
        <select value={equipment} onChange={(e) => setEquipment(e.target.value)}>
          {EQUIPMENT_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <MuscleSelect value={primary} onChange={setPrimary} />
      <SecondaryMuscleChips primary={primary} selected={secondary} onToggle={toggleSecondary} />
      <label className="lbl">
        Aliases <span className="muted">(optional, comma-separated)</span>
        <input
          placeholder="SSQ, sissy"
          value={aliasText}
          onChange={(e) => setAliasText(e.target.value)}
        />
      </label>
      <button type="submit" className="primary" disabled={busy || !name.trim()}>
        {submitLabel}
      </button>
    </form>
  );
}
