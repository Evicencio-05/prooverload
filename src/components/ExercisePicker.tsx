import { useMemo, useState } from 'react';
import { searchCatalog } from '../data/exercises';
import { MUSCLE_LABEL } from '../data/muscles';
import {
  findCustomByName,
  hasUsefulCatalogHits,
  inferCustomDefaults,
  titleCaseExerciseName,
} from '../lib/customCatalog';
import { useApp } from '../state/AppState';
import type { CatalogExercise } from '../types';
import { CustomBadge } from './CustomBadge';
import { CustomExerciseForm } from './CustomExerciseForm';

function ExercisePickRow({
  ex,
  onPick,
}: {
  ex: CatalogExercise;
  onPick: (ex: CatalogExercise) => void;
}) {
  return (
    <button type="button" className="row" onClick={() => onPick(ex)}>
      <span className="row-main">
        <span className="row-name">
          {ex.name}
          {ex.custom ? <CustomBadge queued={Boolean(ex.promoteRequestedAt)} /> : null}
        </span>
        <small>{ex.primary.map((m) => MUSCLE_LABEL[m]).join(', ')}</small>
      </span>
    </button>
  );
}

export function ExercisePicker({
  onPick,
  onClose,
}: {
  onPick: (ex: CatalogExercise) => void;
  onClose: () => void;
}) {
  const { catalog, customExercises, favorites, workouts, saveCustomExercise } = useApp();
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [formDraft, setFormDraft] = useState<Partial<CatalogExercise> | undefined>();

  const recent = useMemo(() => {
    const ids: string[] = [];
    const ordered = [...workouts].sort((a, b) => b.startedAt - a.startedAt);
    for (const w of ordered) {
      for (const e of [...w.exercises].reverse()) {
        if (!ids.includes(e.exerciseId)) ids.push(e.exerciseId);
      }
    }
    return ids
      .map((id) => catalog.find((c) => c.id === id))
      .filter((x): x is CatalogExercise => Boolean(x))
      .slice(0, 8);
  }, [workouts, catalog]);

  const favs = catalog.filter((c) => favorites.includes(c.id));
  const results = searchCatalog(catalog, q);
  const query = q.trim();
  const usefulHits = hasUsefulCatalogHits(catalog, query);
  const showQuickAdd = Boolean(query) && !usefulHits;

  function openForm(name: string) {
    const titled = titleCaseExerciseName(name);
    const inferred = inferCustomDefaults(name);
    setFormDraft({
      name: titled,
      equipment: inferred.equipment,
      primary: [inferred.primary],
      secondary: inferred.secondary,
    });
    setFormKey((n) => n + 1);
    setCreating(true);
  }

  async function quickAdd(raw: string) {
    const name = titleCaseExerciseName(raw);
    const existing = findCustomByName(customExercises, name);
    if (existing) {
      onPick(existing);
      return;
    }
    const inferred = inferCustomDefaults(raw);
    if (!inferred.confident) {
      openForm(raw);
      return;
    }
    const ex = await saveCustomExercise({
      name,
      equipment: inferred.equipment,
      primary: [inferred.primary],
      secondary: inferred.secondary,
    });
    onPick(ex);
  }

  return (
    <div className="sheet" role="dialog" aria-label="Choose exercise">
      <div className="sheet-handle">
        <strong>Add exercise</strong>
        <button type="button" className="ghost" onClick={onClose}>
          Close
        </button>
      </div>
      <input
        className="search"
        autoFocus
        placeholder="Search movements"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {showQuickAdd && (
        <button type="button" className="primary huge" onClick={() => void quickAdd(query)}>
          Add «{query}» as custom
        </button>
      )}
      {showQuickAdd && results.length === 0 && (
        <p className="hint">No library match. One tap saves it as a custom and adds it to this session.</p>
      )}
      {showQuickAdd && results.length > 0 && (
        <p className="hint">No close name match. Equipment hits are below, or add «{query}» as custom.</p>
      )}
      {!query && favs.length > 0 && (
        <section>
          <h3>Favorites</h3>
          {favs.map((ex) => (
            <ExercisePickRow key={ex.id} ex={ex} onPick={onPick} />
          ))}
        </section>
      )}
      {!query && recent.length > 0 && (
        <section>
          <h3>Recent</h3>
          {recent.map((ex) => (
            <ExercisePickRow key={ex.id} ex={ex} onPick={onPick} />
          ))}
        </section>
      )}
      <section>
        <h3>{query ? 'Results' : 'Library'}</h3>
        {(query ? results : catalog).slice(0, 60).map((ex) => (
          <ExercisePickRow key={ex.id} ex={ex} onPick={onPick} />
        ))}
      </section>
      <button
        type="button"
        className="secondary"
        onClick={() => {
          if (creating) {
            setCreating(false);
            return;
          }
          openForm(query);
        }}
      >
        {creating ? 'Cancel custom' : 'Custom exercise'}
      </button>
      {creating && (
        <CustomExerciseForm
          key={formKey}
          draft={formDraft}
          onSaved={(ex) => onPick(ex)}
        />
      )}
    </div>
  );
}
