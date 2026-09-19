import { useMemo, useState } from 'react';
import { CustomBadge } from '../components/CustomBadge';
import { CustomExerciseForm } from '../components/CustomExerciseForm';
import { PromotePanel } from '../components/PromotePanel';
import { searchCatalog } from '../data/exercises';
import { formatMuscleList } from '../data/muscles';
import {
  findCustomByName,
  hasUsefulCatalogHits,
  inferCustomDefaults,
  titleCaseExerciseName,
} from '../lib/customCatalog';
import { useApp } from '../state/AppState';
import type { CatalogExercise } from '../types';

function LibraryRow({
  ex,
  starred,
  onStar,
  onSuggest,
  onEdit,
}: {
  ex: CatalogExercise;
  starred: boolean;
  onStar: () => void;
  onSuggest?: () => void;
  onEdit?: () => void;
}) {
  return (
    <li className="row static">
      <div>
        <strong className="row-name">
          {ex.name}
          {ex.custom ? <CustomBadge queued={Boolean(ex.promoteRequestedAt)} /> : null}
        </strong>
        <p className="muted">
          {formatMuscleList(ex.primary)}
          {ex.secondary.length ? ` · ${formatMuscleList(ex.secondary)}` : ''}
          {ex.equipment ? ` · ${ex.equipment}` : ''}
        </p>
        {ex.custom && (
          <div className="row-actions">
            {onEdit && (
              <button type="button" className="ghost" onClick={onEdit}>
                Edit
              </button>
            )}
            {onSuggest && (
              <button type="button" className="ghost" onClick={onSuggest}>
                {ex.promoteRequestedAt ? 'Promotion payload' : 'Suggest for library'}
              </button>
            )}
          </div>
        )}
      </div>
      <button type="button" className="star" onClick={onStar}>
        {starred ? '★' : '☆'}
      </button>
    </li>
  );
}

export function YouPage() {
  const app = useApp();
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CatalogExercise | null>(null);
  const [promoting, setPromoting] = useState<CatalogExercise | null>(null);
  const results = useMemo(() => searchCatalog(app.catalog, q), [app.catalog, q]);
  const query = q.trim();
  const usefulHits = hasUsefulCatalogHits(app.catalog, query);
  const showQuickAdd = Boolean(query) && !usefulHits;
  const customs = app.customExercises;
  const libraryRows = query ? results : results.filter((ex) => !ex.custom);

  async function quickAddToLibrary(raw: string) {
    const name = titleCaseExerciseName(raw);
    if (findCustomByName(customs, name)) return;
    const inferred = inferCustomDefaults(raw);
    if (!inferred.confident) {
      setCreating(true);
      return;
    }
    await app.saveCustomExercise({
      name,
      equipment: inferred.equipment,
      primary: [inferred.primary],
      secondary: inferred.secondary,
    });
  }

  return (
    <main className="screen">
      <header className="top">
        <h1>You</h1>
      </header>
      <p className="muted">{app.user?.email}</p>
      <p className={`banner ${app.online ? 'ok' : 'err'}`}>
        {app.online
          ? app.pending
            ? `${app.pending} change(s) still syncing`
            : 'Cloud account connected'
          : 'Offline — logging stays on this phone until the network returns'}
      </p>
      <div className="seg">
        <button
          type="button"
          className={app.profile.unit === 'kg' ? 'on' : ''}
          onClick={() => void app.setUnit('kg')}
        >
          kg
        </button>
        <button
          type="button"
          className={app.profile.unit === 'lb' ? 'on' : ''}
          onClick={() => void app.setUnit('lb')}
        >
          lb
        </button>
      </div>
      <h2>Library</h2>
      <input className="search" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
      {showQuickAdd && (
        <button type="button" className="primary" onClick={() => void quickAddToLibrary(query)}>
          Add «{query}» as custom
        </button>
      )}
      {!query && customs.length > 0 && (
        <>
          <h3>Your customs</h3>
          <ul className="list">
            {customs.map((ex) => (
              <LibraryRow
                key={ex.id}
                ex={ex}
                starred={app.favorites.includes(ex.id)}
                onStar={() => void app.toggleFavorite(ex.id)}
                onSuggest={() => setPromoting(ex)}
                onEdit={() => setEditing(ex)}
              />
            ))}
          </ul>
        </>
      )}
      <ul className="list">
        {libraryRows.slice(0, 80).map((ex) => (
          <LibraryRow
            key={ex.id}
            ex={ex}
            starred={app.favorites.includes(ex.id)}
            onStar={() => void app.toggleFavorite(ex.id)}
            onSuggest={ex.custom ? () => setPromoting(ex) : undefined}
            onEdit={ex.custom ? () => setEditing(ex) : undefined}
          />
        ))}
      </ul>
      <button type="button" className="secondary" onClick={() => setCreating((v) => !v)}>
        {creating ? 'Cancel custom' : 'New custom exercise'}
      </button>
      {creating && (
        <CustomExerciseForm
          draft={query ? { name: titleCaseExerciseName(query) } : undefined}
          submitLabel="Save custom"
          onSaved={() => setCreating(false)}
        />
      )}
      {editing && (
        <div className="card">
          <h3>Edit custom</h3>
          <CustomExerciseForm
            key={editing.id}
            draft={editing}
            submitLabel="Save changes"
            onSaved={() => setEditing(null)}
          />
          <button type="button" className="ghost" onClick={() => setEditing(null)}>
            Close
          </button>
        </div>
      )}
      <button type="button" className="ghost" onClick={() => void app.signOut()}>
        Sign out
      </button>
      {promoting && <PromotePanel exercise={promoting} onClose={() => setPromoting(null)} />}
    </main>
  );
}
