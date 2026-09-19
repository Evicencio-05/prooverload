import { bestForGoal, exerciseById } from '../lib/overload';
import { useApp } from '../state/AppState';

export function GoalsPage() {
  const app = useApp();
  const rows = [...app.goals].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <main className="screen">
      <header className="top">
        <h1>Goals</h1>
      </header>
      <p className="hint">Set targets from any exercise on the Log tab. Progress uses your working-set history.</p>
      {rows.length === 0 && (
        <div className="empty-card card">
          <h2>No goals yet</h2>
          <p className="muted">Open any movement on Log and tap Set goal. Overload cues stay optional.</p>
        </div>
      )}
      <ul className="list goals-grid">
        {rows.map((g) => {
          const ex = exerciseById(app.catalog, g.exerciseId);
          const best = bestForGoal(app.workouts, g.exerciseId);
          const done =
            Boolean(g.completedAt) ||
            (g.kind === 'weight' && best && g.targetWeight && best.weight >= g.targetWeight) ||
            (g.kind === 'reps' && best && g.targetReps && best.reps >= g.targetReps);
          const dateDone = g.kind === 'date' && g.targetDate ? new Date(g.targetDate).getTime() <= Date.now() : false;
          return (
            <li key={g.id} className="card">
              <strong>{ex?.name ?? 'Exercise'}</strong>
              <p>
                {g.kind === 'weight' && `Target ${g.targetWeight}${app.profile.unit}`}
                {g.kind === 'reps' && `Target ${g.targetReps} reps`}
                {g.kind === 'date' && `By ${g.targetDate}`}
              </p>
              <p className="muted">
                {best ? `Best ${best.weight}${app.profile.unit} × ${best.reps}` : 'No working sets yet'}
                {(done || dateDone) ? ' · reached / due' : ''}
              </p>
              <div className="row-actions">
                {!g.completedAt && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => void app.saveGoal({ ...g, completedAt: Date.now() })}
                  >
                    Mark done
                  </button>
                )}
                <button type="button" className="ghost" onClick={() => void app.deleteGoal(g.id)}>
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
