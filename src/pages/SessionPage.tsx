import { Link, useNavigate, useParams } from 'react-router-dom';
import { CustomBadge } from '../components/CustomBadge';
import { SetEditor } from '../components/SetEditor';
import { ExercisePicker } from '../components/ExercisePicker';
import { exerciseById } from '../lib/overload';
import { pendingPlan, workingSetCount } from '../lib/plan';
import { useApp } from '../state/AppState';
import { useState } from 'react';

export function SessionPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const app = useApp();
  const workout = app.workouts.find((w) => w.id === id);
  const [picker, setPicker] = useState(false);

  if (!workout) {
    return (
      <main className="screen">
        <p>Session not found.</p>
        <Link to="/history">Back</Link>
      </main>
    );
  }

  return (
    <main className="screen log">
      <header className="top">
        <button type="button" className="ghost" onClick={() => nav(-1)}>
          Back
        </button>
        <h1>{workout.date}</h1>
        {workout.status === 'active' ? (
          <button type="button" className="ghost" onClick={() => void app.finishWorkout(workout.id)}>
            Finish
          </button>
        ) : (
          <span className="muted">Finished</span>
        )}
      </header>
      <p className="hint">Fix gym typos here. Edits sync to your account.</p>
      {pendingPlan(workout).length > 0 && (
        <p className="muted span-all">
          Planned, not logged:{' '}
          {pendingPlan(workout)
            .map((p) => exerciseById(app.catalog, p.exerciseId)?.name)
            .filter(Boolean)
            .join(', ')}
        </p>
      )}
      {workout.exercises.map((block) => {
        const ex = exerciseById(app.catalog, block.exerciseId);
        const working = workingSetCount(block);
        return (
        <article key={block.id} className="ex-block">
          <h2 className="row-name">
            {ex?.name}
            {ex?.custom ? <CustomBadge queued={Boolean(ex.promoteRequestedAt)} /> : null}
          </h2>
          <p className="muted">
            {working} working
            {block.targetWorkingSets ? ` / ${block.targetWorkingSets} planned` : ''}
          </p>
          {block.sets.map((set) => (
            <SetEditor
              key={set.id}
              set={set}
              unit={app.profile.unit}
              onChange={(patch) => void app.updateSet(workout.id, block.id, set.id, patch)}
              onDuplicate={() => void app.duplicateLastSet(workout.id, block.id)}
              onDelete={() => void app.deleteSet(workout.id, block.id, set.id)}
            />
          ))}
          <button type="button" className="primary" onClick={() => void app.addSet(workout.id, block.id)}>
            Add set
          </button>
        </article>
        );
      })}
      <button type="button" className="primary huge add-ex" onClick={() => setPicker(true)}>
        Add exercise
      </button>
      {picker && (
        <ExercisePicker
          onClose={() => setPicker(false)}
          onPick={(ex) => {
            void app.addExercise(workout.id, ex.id);
            setPicker(false);
          }}
        />
      )}
    </main>
  );
}
