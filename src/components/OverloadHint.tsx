import { useMemo, useState } from 'react';
import {
  bestForGoal,
  fmt,
  formatSetLine,
  lastSessionForExercise,
  suggestNextLoad,
  workingLoadHistory,
} from '../lib/overload';
import { useApp } from '../state/AppState';
import type { GoalKind } from '../types';
import { uid } from '../lib/ids';

export function OverloadHint({
  exerciseId,
  workoutId,
  onApply,
}: {
  exerciseId: string;
  workoutId: string;
  onApply?: () => void;
}) {
  const app = useApp();
  const last = lastSessionForExercise(app.workouts, exerciseId, workoutId);
  const suggestion = last ? suggestNextLoad(last.block.sets, app.profile.unit) : undefined;
  const hist = workingLoadHistory(app.workouts, exerciseId).slice(-5);
  const goal = app.goals.find((g) => g.exerciseId === exerciseId && !g.completedAt);
  const best = bestForGoal(app.workouts, exerciseId);
  const [goalOpen, setGoalOpen] = useState(false);

  const lastText = useMemo(() => {
    if (!last) return null;
    const bits = last.block.sets
      .filter((s) => !s.warmup)
      .map((s) => formatSetLine(s, app.profile.unit));
    return `Last (${last.workout.date}): ${bits.join(', ') || 'warmups only'}`;
  }, [last, app.profile.unit]);

  return (
    <div className="hint-card">
      {lastText ? <p>{lastText}</p> : <p className="muted">No prior working sets. First time here — 2–3 hard sets to failure is enough.</p>}
      {suggestion && (
        <p className={`overload-cue ${suggestion.action}`}>
          <span className="overload-badge">{suggestion.action}</span>
          {suggestion.reason}
        </p>
      )}
      {suggestion && onApply && (
        <button type="button" className="secondary" onClick={onApply}>
          Apply {fmt(suggestion.weight, app.profile.unit)} × {suggestion.reps}
        </button>
      )}
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
