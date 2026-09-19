export type MuscleId =
  | 'chest'
  | 'upper_back'
  | 'lats'
  | 'traps'
  | 'lower_back'
  | 'front_delts'
  | 'side_delts'
  | 'rear_delts'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'adductors'
  | 'calves';

export type Unit = 'kg' | 'lb';

export type CatalogExercise = {
  id: string;
  name: string;
  aliases?: string[];
  equipment: string;
  primary: MuscleId[];
  secondary: MuscleId[];
  custom?: boolean;
};

export type LoggedSet = {
  id: string;
  weight: number;
  reps: number;
  rpe?: number | null;
  notes?: string;
  warmup: boolean;
  completedAt: number;
};

export type WorkoutExercise = {
  id: string;
  exerciseId: string;
  sets: LoggedSet[];
};

export type Workout = {
  id: string;
  date: string;
  status: 'active' | 'finished';
  startedAt: number;
  finishedAt?: number;
  updatedAt: number;
  exercises: WorkoutExercise[];
};

export type GoalKind = 'weight' | 'reps' | 'date';

export type Goal = {
  id: string;
  exerciseId: string;
  kind: GoalKind;
  targetWeight?: number;
  targetReps?: number;
  targetDate?: string;
  note?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
};

export type UserProfile = {
  unit: Unit;
  updatedAt: number;
};

export type OutboxItem = {
  id: string;
  collection: 'workouts' | 'goals' | 'customExercises' | 'favorites' | 'profile';
  docId: string;
  payload: unknown;
  deleted?: boolean;
  at: number;
};
