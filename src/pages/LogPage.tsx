import { useMemo, useState } from 'react';
import { ExercisePicker } from '../components/ExercisePicker';
import { RestChip } from '../components/RestChip';
import { SetEditor } from '../components/SetEditor';
import { MUSCLE_LABEL } from '../data/muscles';
import { bestForGoal, exerciseById, lastSessionForExercise, suggestNextLoad, workingLoadHistory } from '../lib/overload';
import { useApp } from '../state/AppState';
import type { GoalKind } from '../types';
import { uid } from '../lib/ids';

export function LogPage() {
  const app = useApp();
  const session = app.todayWorkout();
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);

  async function ensureSession() {
    setBusy(true);
    try {
      await app.startToday();
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
        <p className="hint">One tap. Add an exercise next. Rest timers never block logging.</p>
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

      {session.exercises.map((block) => {
        const ex = exerciseById(app.catalog, block.exerciseId);
        return (
          <article key={block.id} className="ex-block">
            <div className="ex-head">
              <div>
                <h2>{ex?.name ?? 'Exercise'}</h2>
                <p className="muted">
                  {ex?.primary.map((m) => MUSCLE_LABEL[m]).join(', ')}
                </p>
              </div>
              <button type="button" className="star" onClick={() => void app.toggleFavorite(block.exerciseId)}>
                {app.favorites.includes(block.exerciseId) ? '★' : '☆'}
              </button>
            </div>
            <OverloadHint exerciseId={block.exerciseId} workoutId={session.id} />
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

      <button type="button" className="primary huge" onClick={() => setPicker(true)}>
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

function OverloadHint({ exerciseId, workoutId }: { exerciseId: string; workoutId: string }) {
  const app = useApp();
  const last = lastSessionForExercise(app.workouts, exerciseId, workoutId);
  const suggestion = last ? suggestNextLoad(last.block.sets, app.profile.unit) : undefined;
  const hist = workingLoadHistory(app.workouts, exerciseId).slice(-5);
  const goal = app.goals.find((g) => g.exerciseId === exerciseId && !g.completedAt);
  const best = bestForGoal(app.workouts, exerciseId);
  const [goalOpen, setGoalOpen] = useState(false);

  const lastText = useMemo(() => {
    if (!last) return 'No prior working sets yet.';
    const bits = last.block.sets
      .filter((s) => !s.warmup)
      .map((s) => `${s.weight}${app.profile.unit}×${s.reps}`);
    return `Last (${last.workout.date}): ${bits.join(', ') || 'warmups only'}`;
  }, [last, app.profile.unit]);

  return (
    <div className="hint-card">
      <p>{lastText}</p>
      {suggestion && <p className="accent">{suggestion.reason}</p>}
      {hist.length > 1 && (
        <p className="muted">
          Working-set load: {hist.map((h) => `${h.weight}×${h.reps}`).join(' → ')}
        </p>
      )}
      {goal && (
        <p>
          Goal:{' '}
          {goal.kind === 'weight' && `hit ${goal.targetWeight}${app.profile.unit}`}
          {goal.kind === 'reps' && `hit ${goal.targetReps} reps`}
          {goal.kind === 'date' && `by ${goal.targetDate}`}
          {best && ` · best ${best.weight}${app.profile.unit}×${best.reps}`}
          {goal.completedAt ? ' · done' : ''}
        </p>
      )}
      <button type="button" className="ghost" onClick={() => setGoalOpen((v) => !v)}>
        {goal ? 'Edit goal' : 'Set goal'}
      </button>
      {goalOpen && (
        <GoalMini
          exerciseId={exerciseId}
          onClose={() => setGoalOpen(false)}
        />
      )}
    </div>
  );
}

function GoalMini({ exerciseId, onClose }: { exerciseId: string; onClose: () => void }) {
  const app = useApp();
  const existing = app.goals.find((g) => g.exerciseId === exerciseId && !g.completedAt);
  const [kind, setKind] = useState<GoalKind>(existing?.kind ?? 'weight');
  const [weight, setWeight] = useState(existing?.targetWeight ?? 60);
  const [reps, setReps] = useState(existing?.targetReps ?? 8);
  const [date, setDate] = useState(existing?.targetDate ?? '');

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        void app.saveGoal({
          id: existing?.id ?? uid('goal'),
          exerciseId,
          kind,
          targetWeight: kind === 'weight' ? weight : undefined,
          targetReps: kind === 'reps' ? reps : undefined,
          targetDate: kind === 'date' ? date : undefined,
          createdAt: existing?.createdAt ?? Date.now(),
          updatedAt: Date.now(),
        });
        onClose();
      }}
    >
      <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
        <option value="weight">Target weight</option>
        <option value="reps">Target reps</option>
        <option value="date">By date</option>
      </select>
      {kind === 'weight' && (
        <input
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(Number(e.target.value) || 0)}
        />
      )}
      {kind === 'reps' && (
        <input inputMode="numeric" value={reps} onChange={(e) => setReps(Number(e.target.value) || 0)} />
      )}
      {kind === 'date' && (
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      )}
      <button type="submit" className="secondary">
        Save goal
      </button>
    </form>
  );
}
