import { useMemo, useState } from 'react';
import { searchCatalog } from '../data/exercises';
import { MUSCLE_LABEL } from '../data/muscles';
import { useApp } from '../state/AppState';
import type { CatalogExercise, MuscleId } from '../types';

export function ExercisePicker({
  onPick,
  onClose,
}: {
  onPick: (ex: CatalogExercise) => void;
  onClose: () => void;
}) {
  const { catalog, favorites, workouts, saveCustomExercise } = useApp();
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [primary, setPrimary] = useState<MuscleId>('chest');

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
      {!q && favs.length > 0 && (
        <section>
          <h3>Favorites</h3>
          {favs.map((ex) => (
            <button key={ex.id} type="button" className="row" onClick={() => onPick(ex)}>
              {ex.name}
            </button>
          ))}
        </section>
      )}
      {!q && recent.length > 0 && (
        <section>
          <h3>Recent</h3>
          {recent.map((ex) => (
            <button key={ex.id} type="button" className="row" onClick={() => onPick(ex)}>
              {ex.name}
            </button>
          ))}
        </section>
      )}
      <section>
        <h3>{q ? 'Results' : 'Library'}</h3>
        {(q ? results : catalog).slice(0, 60).map((ex) => (
          <button key={ex.id} type="button" className="row" onClick={() => onPick(ex)}>
            <span>{ex.name}</span>
            <small>{ex.primary.map((m) => MUSCLE_LABEL[m]).join(', ')}</small>
          </button>
        ))}
      </section>
      <button type="button" className="secondary" onClick={() => setCreating((v) => !v)}>
        Custom exercise
      </button>
      {creating && (
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            const ex = await saveCustomExercise({
              name: name.trim(),
              equipment: 'other',
              primary: [primary],
              secondary: [],
            });
            onPick(ex);
          }}
        >
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <select value={primary} onChange={(e) => setPrimary(e.target.value as MuscleId)}>
            {Object.entries(MUSCLE_LABEL).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <button type="submit" className="primary">
            Save & add
          </button>
        </form>
      )}
    </div>
  );
}
