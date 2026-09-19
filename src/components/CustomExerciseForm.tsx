import { useState } from 'react';
import { MUSCLES, MUSCLE_LABEL } from '../data/muscles';
import { EQUIPMENT_OPTIONS, inferCustomDefaults, parseAliases, titleCaseExerciseName } from '../lib/customCatalog';
import { useApp } from '../state/AppState';
import type { CatalogExercise, MuscleId } from '../types';

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
  const [name, setName] = useState(draft?.name ?? '');
  const [equipment, setEquipment] = useState(draft?.equipment ?? inferred.equipment);
  const [primary, setPrimary] = useState<MuscleId>(draft?.primary?.[0] ?? inferred.primary);
  const [secondary, setSecondary] = useState<MuscleId[]>(draft?.secondary ?? inferred.secondary);
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
      <label className="lbl">
        Primary muscle
        <select value={primary} onChange={(e) => setPrimary(e.target.value as MuscleId)}>
          {Object.entries(MUSCLE_LABEL).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="stack tight">
        <legend className="lbl">Secondary muscles</legend>
        <div className="chip-wrap">
          {MUSCLES.filter((m) => m.id !== primary).map((m) => (
            <button
              key={m.id}
              type="button"
              className={`chip${secondary.includes(m.id) ? ' on' : ''}`}
              onClick={() => toggleSecondary(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </fieldset>
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
