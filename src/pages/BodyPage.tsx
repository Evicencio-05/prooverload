import { useMemo, useState } from 'react';
import { MuscleMap } from '../components/MuscleMap';
import { analyzeBody, suggestExercisesFor } from '../lib/bodyAnalysis';
import { useApp } from '../state/AppState';

export function BodyPage() {
  const { workouts, catalog } = useApp();
  const [view, setView] = useState<'front' | 'back'>('front');
  const analysis = useMemo(() => analyzeBody(workouts, catalog), [workouts, catalog]);
  const suggestions = suggestExercisesFor(
    analysis.underworked.slice(0, 4).map((m) => m.id),
    catalog,
  );

  return (
    <main className="screen">
      <header className="top">
        <h1>Body</h1>
      </header>
      <p className="disclaimer">
        Training-volume guidance from your own sessions — not a diagnosis, injury screen, or body
        scan.
      </p>
      <div className="seg">
        <button type="button" className={view === 'front' ? 'on' : ''} onClick={() => setView('front')}>
          Front
        </button>
        <button type="button" className={view === 'back' ? 'on' : ''} onClick={() => setView('back')}>
          Back
        </button>
      </div>
      <MuscleMap stats={analysis.stats} view={view} />
      <ul className="legend">
        <li><i className="swatch fresh" /> Last 0–1 days</li>
        <li><i className="swatch mid" /> 2–3 days</li>
        <li><i className="swatch old" /> 4–5 days</li>
        <li><i className="swatch cold" /> 6+ days / none</li>
      </ul>
      {analysis.explanation.map((line) => (
        <p key={line} className="muted">
          {line}
        </p>
      ))}
      {analysis.underworked.length > 0 && (
        <section>
          <h2>Underworked</h2>
          <ul className="list">
            {analysis.underworked.slice(0, 8).map((m) => (
              <li key={m.id} className="row static">
                <span>{m.label}</span>
                <small>
                  {m.daysAgo === null ? 'no working sets' : `${m.daysAgo}d ago`} · {Math.round(m.volume)} vol
                </small>
              </li>
            ))}
          </ul>
          <h3>Try next</h3>
          <ul>
            {suggestions.map((ex) => (
              <li key={ex.id}>{ex.name}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
