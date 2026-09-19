import { useState } from 'react';
import { CustomBadge } from '../components/CustomBadge';
import { ExercisePicker } from '../components/ExercisePicker';
import { OverloadHint } from '../components/OverloadHint';
import { RestChip } from '../components/RestChip';
import { SessionPlan } from '../components/SessionPlan';
import { SetEditor } from '../components/SetEditor';
import { formatMuscleList } from '../data/muscles';
import { exerciseById } from '../lib/overload';
import { workingSetCount } from '../lib/plan';
import { useApp } from '../state/AppState';

export function LogPage() {
  const app = useApp();
  const session = app.todayWorkout();
  const [picker, setPicker] = useState(false);
  const [planner, setPlanner] = useState(false);
  const [busy, setBusy] = useState(false);

  async function ensureSession() {
    setBusy(true);
    try {
      await app.startToday();
    } finally {
      setBusy(false);
    }
  }

  async function startAndPlan() {
    setBusy(true);
    try {
      await app.startToday();
      setPlanner(true);
    } finally {
      setBusy(false);
    }
  }

  if (!session || session.status === 'finished') {
    return (
      <main className="screen">
        <header className="top">
          <p className="eyebrow">Today</p>
          <h1>ProOverload</h1>
        </header>
        {session?.status === 'finished' && (
          <p className="banner">Today’s session is done. Open History to edit it, or start another.</p>
        )}
        <button type="button" className="primary huge" disabled={busy} onClick={() => void ensureSession()}>
          {session?.status === 'finished' ? 'Start another session' : 'Start today’s session'}
        </button>
        <button type="button" className="secondary" disabled={busy} onClick={() => void startAndPlan()}>
          Plan movements first
        </button>
        <p className="hint">One tap to log. Planning is optional and never blocks the next set.</p>
      </main>
    );
  }

  return (
    <main className="screen log">
      <header className="top">
        <p className="eyebrow">Live session</p>
        <h1>Log</h1>
        <button type="button" className="ghost" onClick={() => void app.finishWorkout(session.id)}>
          Finish
        </button>
      </header>

      <SessionPlan workout={session} pickerOpen={planner} onTogglePicker={setPlanner} />

      {session.exercises.length === 0 && (
        <div className="empty-log card">
          <h2>Ready to log</h2>
          <p className="muted">
            Add a movement and record 2–3 hard sets to failure. The plan above is a queue — it does not have to be filled in.
          </p>
        </div>
      )}

      {session.exercises.map((block) => {
        const ex = exerciseById(app.catalog, block.exerciseId);
        const working = workingSetCount(block);
        const target = block.targetWorkingSets;
        return (
          <article key={block.id} className="ex-block">
            <div className="ex-head">
              <div>
                <h2 className="row-name">
                  {ex?.name ?? 'Exercise'}
                  {ex?.custom ? <CustomBadge queued={Boolean(ex.promoteRequestedAt)} /> : null}
                </h2>
                <p className="muted">
                  {ex ? formatMuscleList(ex.primary) : ''}
                  {target
                    ? ` · working ${working}/${target}`
                    : working
                      ? ` · ${working} working`
                      : ''}
                </p>
              </div>
              <button type="button" className="star" onClick={() => void app.toggleFavorite(block.exerciseId)}>
                {app.favorites.includes(block.exerciseId) ? '★' : '☆'}
              </button>
            </div>
            <OverloadHint
              exerciseId={block.exerciseId}
              workoutId={session.id}
              onApply={() => void app.applyOverload(session.id, block.id)}
            />
            {block.sets.map((set) => (
              <SetEditor
                key={set.id}
                set={set}
                unit={app.profile.unit}
                onChange={(patch) => void app.updateSet(session.id, block.id, set.id, patch)}
                onDuplicate={() => void app.duplicateLastSet(session.id, block.id)}
                onDelete={() => void app.deleteSet(session.id, block.id, set.id)}
              />
            ))}
            <button
              type="button"
              className="primary"
              onClick={() => void app.addSet(session.id, block.id)}
            >
              Add set
            </button>
            <button
              type="button"
              className="ghost danger"
              onClick={() => void app.removeExercise(session.id, block.id)}
            >
              Remove exercise
            </button>
          </article>
        );
      })}

      <button type="button" className="primary huge add-ex" onClick={() => setPicker(true)}>
        Add exercise
      </button>
      <RestChip />
      {picker && (
        <ExercisePicker
          onClose={() => setPicker(false)}
          onPick={(ex) => {
            void app.addExercise(session.id, ex.id);
            setPicker(false);
          }}
        />
      )}
    </main>
  );
}
