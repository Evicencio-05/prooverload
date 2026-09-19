import { useMemo, useState } from 'react';
import { MuscleMap } from '../components/MuscleMap';
import { MUSCLE_REGIONS } from '../data/muscles';
import { analyzeBody, suggestExercisesFor, type MuscleStat } from '../lib/bodyAnalysis';
import { useApp } from '../state/AppState';

function groupByRegion(stats: MuscleStat[]) {
  return MUSCLE_REGIONS.map((region) => ({
    region,
    items: stats.filter((s) => s.region === region),
  })).filter((g) => g.items.length > 0);
}

function recency(stat: MuscleStat): string {
  if (stat.daysAgo === null) return 'no working sets';
  return `${stat.daysAgo}d ago`;
}

export function BodyPage() {
  const { workouts, catalog } = useApp();
  const [view, setView] = useState<'front' | 'back'>('front');
  const analysis = useMemo(() => analyzeBody(workouts, catalog), [workouts, catalog]);
  const suggestions = suggestExercisesFor(
    analysis.underworked.slice(0, 4).map((m) => m.id),
    catalog,
  );
  const underworkedGroups = groupByRegion(analysis.underworked);
  const coverageGroups = groupByRegion(analysis.stats);

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
          {underworkedGroups.map((group) => (
            <div key={group.region}>
              <h3>{group.region}</h3>
              <ul className="list">
                {group.items.slice(0, 8).map((m) => (
                  <li key={m.id} className="row static">
                    <span>{m.label}</span>
                    <small>
                      {recency(m)} · {Math.round(m.volume)} vol
                    </small>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <h3>Try next</h3>
          <ul>
            {suggestions.map((ex) => (
              <li key={ex.id}>{ex.name}</li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h2>Coverage</h2>
        {coverageGroups.map((group) => (
          <div key={group.region}>
            <h3>{group.region}</h3>
            <ul className="list">
              {group.items.map((m) => (
                <li key={m.id} className="row static">
                  <span>{m.label}</span>
                  <small>
                    {recency(m)} · {Math.round(m.volume)} vol
                  </small>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
