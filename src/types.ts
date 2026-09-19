export type MuscleId =
  | 'sternocleidomastoid'
  | 'pectoralis_clavicular'
  | 'pectoralis_sternal'
  | 'pectoralis_costal'
  | 'serratus_anterior'
  | 'anterior_deltoid'
  | 'lateral_deltoid'
  | 'posterior_deltoid'
  | 'triceps_long'
  | 'triceps_lateral'
  | 'triceps_medial'
  | 'biceps_brachii'
  | 'brachialis'
  | 'brachioradialis'
  | 'wrist_flexors'
  | 'wrist_extensors'
  | 'trapezius_upper'
  | 'trapezius_mid'
  | 'trapezius_lower'
  | 'rhomboids'
  | 'latissimus_dorsi'
  | 'teres_major'
  | 'rotator_cuff'
  | 'erector_spinae'
  | 'rectus_abdominis'
  | 'obliques'
  | 'iliopsoas'
  | 'gluteus_maximus'
  | 'gluteus_medius'
  | 'rectus_femoris'
  | 'vastus_lateralis'
  | 'vastus_medialis'
  | 'biceps_femoris'
  | 'semitendinosus'
  | 'adductors'
  | 'gastrocnemius'
  | 'soleus'
  | 'tibialis_anterior';

/** Phase 1 coarse ids that may still appear on synced custom / promote JSON. */
export type LegacyMuscleId =
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
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves';

export type MuscleRegion = 'Push' | 'Pull' | 'Core' | 'Legs';

export type Unit = 'kg' | 'lb';

export type PromoteStatus = 'requested' | 'submitted';

export type CatalogExercise = {
  id: string;
  name: string;
  aliases?: string[];
  equipment: string;
  primary: MuscleId[];
  secondary: MuscleId[];
  custom?: boolean;
  /** Present on customExercises JSON so Instant merge can LWW. */
  updatedAt?: number;
  /** Client-side promotion queue — stored in customExercises JSON only. */
  promoteRequestedAt?: number;
  promoteStatus?: PromoteStatus;
  promoteNote?: string;
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
