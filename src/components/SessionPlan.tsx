import { ExercisePicker } from './ExercisePicker';
import { CustomBadge } from './CustomBadge';
import { exerciseById } from '../lib/overload';
import {
  DEFAULT_WORKING_SETS,
  MAX_WORKING_SETS,
  MIN_WORKING_SETS,
  pendingPlan,
} from '../lib/plan';
import { useApp } from '../state/AppState';
import type { PlannedExercise, Workout } from '../types';

export function SessionPlan({
  workout,
  pickerOpen,
  onTogglePicker,
}: {
  workout: Workout;
  pickerOpen: boolean;
  onTogglePicker: (open: boolean) => void;
}) {
  const app = useApp();
  const items = pendingPlan(workout);

  if (items.length === 0 && !pickerOpen) {
    return (
      <div className="plan-toggle">
        <button type="button" className="ghost" onClick={() => onTogglePicker(true)}>
          Plan movements
        </button>
      </div>
    );
  }

  return (
    <section className="plan-panel card">
      <div className="ex-head">
        <div>
          <h3>Plan</h3>
          <p className="muted">Optional. 2–3 hard sets. Log anytime.</p>
        </div>
        <button type="button" className="ghost" onClick={() => onTogglePicker(!pickerOpen)}>
          {pickerOpen ? 'Close' : 'Add to plan'}
        </button>
      </div>
      {items.length === 0 && (
        <p className="hint">Queue movements here if you want a list. You can still tap Add exercise and log immediately.</p>
      )}
      {items.length > 0 && (
        <ul className="list plan-list">
          {items.map((item) => (
            <PlanRow key={item.id} workoutId={workout.id} item={item} />
          ))}
        </ul>
      )}
      {pickerOpen && (
        <ExercisePicker
          title="Add to plan"
          onClose={() => onTogglePicker(false)}
          onPick={(ex) => {
            void app.addToPlan(workout.id, ex.id, { targetWorkingSets: DEFAULT_WORKING_SETS });
            onTogglePicker(false);
          }}
        />
      )}
    </section>
  );
}

function PlanRow({ workoutId, item }: { workoutId: string; item: PlannedExercise }) {
  const app = useApp();
  const ex = exerciseById(app.catalog, item.exerciseId);
  return (
    <li className="plan-row">
      <div className="row-main">
        <strong className="row-name">
          {ex?.name ?? 'Exercise'}
          {ex?.custom ? <CustomBadge queued={Boolean(ex.promoteRequestedAt)} /> : null}
        </strong>
        <div className="plan-sets">
          <button
            type="button"
            className="step"
            aria-label="Fewer working sets"
            onClick={() =>
              void app.updatePlan(workoutId, item.id, {
                targetWorkingSets: Math.max(MIN_WORKING_SETS, item.targetWorkingSets - 1),
              })
            }
          >
            −
          </button>
          <span>{item.targetWorkingSets} working</span>
          <button
            type="button"
            className="step"
            aria-label="More working sets"
            onClick={() =>
              void app.updatePlan(workoutId, item.id, {
                targetWorkingSets: Math.min(MAX_WORKING_SETS, item.targetWorkingSets + 1),
              })
            }
          >
            +
          </button>
        </div>
      </div>
      <div className="plan-actions">
        <button
          type="button"
          className="secondary"
          onClick={() =>
            void app.addExercise(workoutId, item.exerciseId, {
              targetWorkingSets: item.targetWorkingSets,
              emphasis: item.emphasis,
            })
          }
        >
          Log
        </button>
        <button
          type="button"
          className="ghost"
          aria-label={`Remove ${ex?.name ?? 'exercise'} from plan`}
          onClick={() => void app.removeFromPlan(workoutId, item.id)}
        >
          ×
        </button>
      </div>
    </li>
  );
}
