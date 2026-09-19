import type { DropStep, LoggedSet, SetEmphasis, Unit } from '../types';

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
  const drops = set.drops ?? [];

  function toggleWarmup() {
    if (set.warmup) {
      onChange({ warmup: false, toFailure: true });
      return;
    }
    onChange({ warmup: true, toFailure: undefined, dropset: false, drops: undefined });
  }

  function toggleEmphasis(next: SetEmphasis) {
    onChange({ emphasis: set.emphasis === next ? null : next });
  }

  function patchDrop(index: number, patch: Partial<DropStep>) {
    const next = drops.map((d, i) => (i === index ? { ...d, ...patch } : d));
    onChange({ drops: next, dropset: true });
  }

  function addDrop() {
    const last = drops.at(-1);
    const weight = last ? Math.max(0, last.weight - step) : Math.max(0, set.weight - step);
    const reps = last?.reps ?? Math.max(1, set.reps - 2);
    onChange({ dropset: true, drops: [...drops, { weight, reps }] });
  }

  return (
    <div className={`set-card ${set.warmup ? 'warmup' : ''}`}>
      <div className="set-top">
        <button
          type="button"
          className={set.warmup ? 'chip on' : 'chip'}
          onClick={toggleWarmup}
        >
          {set.warmup ? 'Warmup' : 'Working'}
        </button>
        <button type="button" className="ghost" onClick={onDelete} aria-label="Delete set">
          Delete
        </button>
      </div>
      <div className="tag-row" role="group" aria-label="Set tags">
        <button
          type="button"
          className={set.toFailure ? 'chip on fail' : 'chip'}
          disabled={set.warmup}
          onClick={() => onChange({ toFailure: !set.toFailure })}
        >
          To failure
        </button>
        <button
          type="button"
          className={set.dropset ? 'chip on drop' : 'chip'}
          disabled={set.warmup}
          onClick={() =>
            onChange(set.dropset ? { dropset: false, drops: undefined } : { dropset: true })
          }
        >
          Dropset
        </button>
        <button
          type="button"
          className={set.emphasis === 'stretch' ? 'chip on emphasis' : 'chip'}
          disabled={set.warmup}
          onClick={() => toggleEmphasis('stretch')}
        >
          Stretch
        </button>
        <button
          type="button"
          className={set.emphasis === 'contraction' ? 'chip on emphasis' : 'chip'}
          disabled={set.warmup}
          onClick={() => toggleEmphasis('contraction')}
        >
          Contraction
        </button>
      </div>
      <div className="set-fields">
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
      </div>
      {set.dropset && !set.warmup && (
        <div className="drops">
          {drops.map((drop, i) => (
            <div key={`${drop.weight}-${drop.reps}-${i}`} className="drop-row">
              <span className="lbl">Drop {i + 1}</span>
              <input
                inputMode="decimal"
                value={drop.weight}
                aria-label={`Drop ${i + 1} weight`}
                onChange={(e) => patchDrop(i, { weight: Number(e.target.value) || 0 })}
              />
              <input
                inputMode="numeric"
                value={drop.reps}
                aria-label={`Drop ${i + 1} reps`}
                onChange={(e) => patchDrop(i, { reps: Number(e.target.value) || 0 })}
              />
              <button
                type="button"
                className="ghost"
                aria-label={`Remove drop ${i + 1}`}
                onClick={() => onChange({ drops: drops.filter((_, j) => j !== i) })}
              >
                ×
              </button>
            </div>
          ))}
          {drops.length < 3 && (
            <button type="button" className="ghost" onClick={addDrop}>
              Add drop
            </button>
          )}
        </div>
      )}
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
