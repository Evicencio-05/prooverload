import { DEFAULT_MUSCLE_ID, musclesByRegion } from '../data/muscles';
import type { MuscleId } from '../types';

export function MuscleSelect({
  id,
  value,
  onChange,
  label = 'Primary muscle',
}: {
  id?: string;
  value: MuscleId;
  onChange: (id: MuscleId) => void;
  label?: string;
}) {
  const groups = musclesByRegion();
  const current = groups.some((g) => g.muscles.some((m) => m.id === value))
    ? value
    : DEFAULT_MUSCLE_ID;

  return (
    <label className="lbl" htmlFor={id}>
      {label}
      <select
        id={id}
        value={current}
        onChange={(e) => onChange(e.target.value as MuscleId)}
      >
        {groups.map((group) => (
          <optgroup key={group.region} label={group.region}>
            {group.muscles.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

export function SecondaryMuscleChips({
  primary,
  selected,
  onToggle,
}: {
  primary: MuscleId;
  selected: MuscleId[];
  onToggle: (id: MuscleId) => void;
}) {
  return (
    <fieldset className="stack tight">
      <legend className="lbl">Secondary muscles</legend>
      {musclesByRegion().map((group) => {
        const options = group.muscles.filter((m) => m.id !== primary);
        if (!options.length) return null;
        return (
          <div key={group.region} className="muscle-group">
            <p className="muscle-group-label">{group.region}</p>
            <div className="chip-wrap">
              {options.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`chip${selected.includes(m.id) ? ' on' : ''}`}
                  onClick={() => onToggle(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}
