import type { LoggedSet, Unit } from '../types';

export function SetEditor({
  set,
  unit,
  onChange,
  onDuplicate,
  onDelete,
}: {
  set: LoggedSet;
  unit: Unit;
  onChange: (patch: Partial<LoggedSet>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const step = unit === 'kg' ? 2.5 : 5;
  return (
    <div className={`set-card ${set.warmup ? 'warmup' : ''}`}>
      <div className="set-top">
        <button
          type="button"
          className={set.warmup ? 'chip on' : 'chip'}
          onClick={() => onChange({ warmup: !set.warmup })}
        >
          {set.warmup ? 'Warmup' : 'Working'}
        </button>
        <button type="button" className="ghost" onClick={onDelete} aria-label="Delete set">
          Delete
        </button>
      </div>
      <div className="step-row">
        <span className="lbl">Weight</span>
        <button type="button" className="step" onClick={() => onChange({ weight: Math.max(0, set.weight - step) })}>
          −{step}
        </button>
        <input
          inputMode="decimal"
          value={set.weight}
          onChange={(e) => onChange({ weight: Number(e.target.value) || 0 })}
          aria-label={`Weight in ${unit}`}
        />
        <button type="button" className="step" onClick={() => onChange({ weight: set.weight + step })}>
          +{step}
        </button>
      </div>
      <div className="step-row">
        <span className="lbl">Reps</span>
        <button type="button" className="step" onClick={() => onChange({ reps: Math.max(1, set.reps - 1) })}>
          −1
        </button>
        <input
          inputMode="numeric"
          value={set.reps}
          onChange={(e) => onChange({ reps: Number(e.target.value) || 0 })}
          aria-label="Reps"
        />
        <button type="button" className="step" onClick={() => onChange({ reps: set.reps + 1 })}>
          +1
        </button>
      </div>
      <div className="step-row">
        <span className="lbl">RPE</span>
        <button
          type="button"
          className="step"
          onClick={() => onChange({ rpe: Math.max(5, (set.rpe ?? 7) - 0.5) })}
        >
          −
        </button>
        <input
          inputMode="decimal"
          placeholder="opt"
          value={set.rpe ?? ''}
          onChange={(e) =>
            onChange({ rpe: e.target.value === '' ? null : Number(e.target.value) })
          }
          aria-label="Optional RPE"
        />
        <button
          type="button"
          className="step"
          onClick={() => onChange({ rpe: Math.min(10, (set.rpe ?? 7) + 0.5) })}
        >
          +
        </button>
      </div>
      <input
        className="notes"
        placeholder="Notes (optional)"
        value={set.notes ?? ''}
        onChange={(e) => onChange({ notes: e.target.value })}
      />
      <button type="button" className="secondary" onClick={onDuplicate}>
        Duplicate last set
      </button>
    </div>
  );
}
