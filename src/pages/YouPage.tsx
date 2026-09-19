import { useMemo, useState } from 'react';
import { searchCatalog } from '../data/exercises';
import { MUSCLE_LABEL } from '../data/muscles';
import { useApp } from '../state/AppState';

export function YouPage() {
  const app = useApp();
  const [q, setQ] = useState('');
  const results = useMemo(() => searchCatalog(app.catalog, q), [app.catalog, q]);

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
      <ul className="list">
        {results.slice(0, 80).map((ex) => (
          <li key={ex.id} className="row static">
            <div>
              <strong>{ex.name}</strong>
              <p className="muted">
                {ex.primary.map((m) => MUSCLE_LABEL[m]).join(', ')}
                {ex.secondary.length ? ` · ${ex.secondary.map((m) => MUSCLE_LABEL[m]).join(', ')}` : ''}
              </p>
            </div>
            <button type="button" className="star" onClick={() => void app.toggleFavorite(ex.id)}>
              {app.favorites.includes(ex.id) ? '★' : '☆'}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="ghost" onClick={() => void app.signOut()}>
        Sign out
      </button>
    </main>
  );
}
