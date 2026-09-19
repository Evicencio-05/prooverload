import { Link, useNavigate, useParams } from 'react-router-dom';
import { SetEditor } from '../components/SetEditor';
import { ExercisePicker } from '../components/ExercisePicker';
import { exerciseById } from '../lib/overload';
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
      {workout.exercises.map((block) => (
        <article key={block.id} className="ex-block">
          <h2>{exerciseById(app.catalog, block.exerciseId)?.name}</h2>
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
      ))}
      <button type="button" className="primary huge" onClick={() => setPicker(true)}>
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
