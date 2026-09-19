import { Link } from 'react-router-dom';
import { formatDay } from '../lib/ids';
import { exerciseById } from '../lib/overload';
import { useApp } from '../state/AppState';

export function HistoryPage() {
  const { workouts, catalog } = useApp();
  const ordered = [...workouts].sort((a, b) => b.startedAt - a.startedAt);

  return (
    <main className="screen">
      <header className="top">
        <h1>History</h1>
      </header>
      {ordered.length === 0 && <p className="muted">No sessions yet. Log one from the home tab.</p>}
      <ul className="list">
        {ordered.map((w) => (
          <li key={w.id}>
            <Link className="row" to={`/history/${w.id}`}>
              <div>
                <strong>{formatDay(w.date)}</strong>
                <p className="muted">
                  {w.status === 'active' ? 'In progress · ' : ''}
                  {w.exercises
                    .map((e) => exerciseById(catalog, e.exerciseId)?.name)
                    .filter(Boolean)
                    .slice(0, 3)
                    .join(', ') || 'Empty'}
                </p>
              </div>
              <span className="chev">Edit</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
