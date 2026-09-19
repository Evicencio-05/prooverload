import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { CATALOG } from '../data/exercises';
import { normalizeCatalogExercise } from '../data/muscles';
import { db, instantConfigError } from '../lib/instant';
import { idbGet, idbSet, outboxAll } from '../lib/idb';
import { uid, todayKey } from '../lib/ids';
import { flushOutbox, listenUserData, writeCloud } from '../lib/sync';
import { lastSessionForExercise, suggestNextLoad } from '../lib/overload';
import type {
  CatalogExercise,
  Goal,
  LoggedSet,
  Unit,
  UserProfile,
  Workout,
  WorkoutExercise,
} from '../types';

type AuthUser = { id: string; email?: string | null };

type State = {
  ready: boolean;
  user: AuthUser | null;
  authError: string | null;
  configError: string | null;
  online: boolean;
  pending: number;
  workouts: Workout[];
  goals: Goal[];
  customExercises: CatalogExercise[];
  favorites: string[];
  profile: UserProfile;
};

type Action =
  | { type: 'hydrate'; payload: Partial<State> }
  | { type: 'auth'; user: AuthUser | null }
  | { type: 'online'; online: boolean }
  | { type: 'pending'; pending: number }
  | { type: 'set'; payload: Partial<State> };

const defaultProfile: UserProfile = { unit: 'kg', updatedAt: 0 };

const initial: State = {
  ready: false,
  user: null,
  authError: null,
  configError: instantConfigError(),
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  pending: 0,
  workouts: [],
  goals: [],
  customExercises: [],
  favorites: [],
  profile: defaultProfile,
};

function mergeByUpdated<T extends { id: string; updatedAt?: number }>(local: T[], remote: T[]): T[] {
  const map = new Map(local.map((row) => [row.id, row]));
  for (const row of remote) {
    const prev = map.get(row.id);
    if (!prev || (row.updatedAt ?? 0) >= (prev.updatedAt ?? 0)) map.set(row.id, row);
  }
  return [...map.values()];
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.payload, ready: true };
    case 'auth':
      return { ...state, user: action.user, ready: true, authError: null };
    case 'online':
      return { ...state, online: action.online };
    case 'pending':
      return { ...state, pending: action.pending };
    case 'set':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

type Api = State & {
  catalog: CatalogExercise[];
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  startToday: () => Promise<Workout>;
  finishWorkout: (workoutId: string) => Promise<void>;
  addExercise: (workoutId: string, exerciseId: string) => Promise<void>;
  removeExercise: (workoutId: string, blockId: string) => Promise<void>;
  addSet: (workoutId: string, blockId: string, partial?: Partial<LoggedSet>) => Promise<void>;
  updateSet: (workoutId: string, blockId: string, setId: string, patch: Partial<LoggedSet>) => Promise<void>;
  duplicateLastSet: (workoutId: string, blockId: string) => Promise<void>;
  deleteSet: (workoutId: string, blockId: string, setId: string) => Promise<void>;
  saveWorkout: (workout: Workout) => Promise<void>;
  toggleFavorite: (exerciseId: string) => Promise<void>;
  saveCustomExercise: (ex: Omit<CatalogExercise, 'id' | 'custom'> & { id?: string }) => Promise<CatalogExercise>;
  requestPromote: (exerciseId: string, note?: string) => Promise<CatalogExercise | null>;
  saveGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  setUnit: (unit: Unit) => Promise<void>;
  todayWorkout: () => Workout | undefined;
};

const Ctx = createContext<Api | null>(null);

async function authWithPassword(
  path: string,
  email: string,
  password: string,
  dispatch: (action: Action) => void,
) {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = (await res.json()) as { token?: string; error?: string };
    if (!res.ok || !body.token) {
      throw new Error(body.error || 'Auth failed');
    }
    if (!db) throw new Error(instantConfigError() || 'Instant is not ready');
    await db.auth.signInWithToken(body.token);
  } catch (err) {
    dispatch({ type: 'set', payload: { authError: (err as Error).message } });
    throw err;
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const stateRef = useRef(state);
  stateRef.current = state;
  const unsubRef = useRef<(() => void) | null>(null);

  const persistLocal = useCallback(async (next: Partial<State>) => {
    const merged = { ...stateRef.current, ...next };
    await idbSet('cache', {
      workouts: merged.workouts,
      goals: merged.goals,
      customExercises: merged.customExercises,
      favorites: merged.favorites,
      profile: merged.profile,
    });
  }, []);

  const enqueue = useCallback(
    async (
      collection: 'workouts' | 'goals' | 'customExercises' | 'favorites' | 'profile',
      docId: string,
      payload: unknown,
      deleted = false,
    ) => {
      const user = stateRef.current.user;
      if (!user) return;
      try {
        await writeCloud(user.id, { collection, docId, payload, deleted });
        const items = await outboxAll();
        dispatch({ type: 'pending', pending: items.length });
      } catch {
        dispatch({ type: 'pending', pending: stateRef.current.pending + 1 });
      }
    },
    [],
  );

  useEffect(() => {
    const on = () => dispatch({ type: 'online', online: true });
    const off = () => dispatch({ type: 'online', online: false });
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    let stop = false;
    let unsubAuth: (() => void) | undefined;
    (async () => {
      const cache = await idbGet<Partial<State>>('cache');
      if (!stop && cache) dispatch({ type: 'hydrate', payload: cache });
      if (!db) {
        dispatch({
          type: 'set',
          payload: { ready: true, configError: instantConfigError() },
        });
        return;
      }
      unsubAuth = db.subscribeAuth((auth) => {
        const user = auth.user ? { id: auth.user.id, email: auth.user.email } : null;
        dispatch({ type: 'auth', user });
        unsubRef.current?.();
        unsubRef.current = null;
        if (!user) return;
        void (async () => {
          dispatch({ type: 'pending', pending: (await outboxAll()).length });
          await flushOutbox(user.id);
          dispatch({ type: 'pending', pending: (await outboxAll()).length });
          unsubRef.current = listenUserData(user.id, (partial) => {
            const payload: Partial<State> = { ...partial };
            if (partial.workouts) {
              payload.workouts = mergeByUpdated(stateRef.current.workouts, partial.workouts);
            }
            if (partial.goals) {
              payload.goals = mergeByUpdated(stateRef.current.goals, partial.goals);
            }
            if (partial.customExercises) {
              payload.customExercises = mergeByUpdated(
                stateRef.current.customExercises,
                partial.customExercises,
              );
            }
            dispatch({ type: 'set', payload });
            void persistLocal(payload);
          });
        })();
      });
    })();
    return () => {
      stop = true;
      unsubAuth?.();
      unsubRef.current?.();
    };
  }, [persistLocal]);

  useEffect(() => {
    if (!state.online || !state.user) return;
    void flushOutbox(state.user.id).then(async () => {
      dispatch({ type: 'pending', pending: (await outboxAll()).length });
    });
  }, [state.online, state.user]);

  const saveWorkout = useCallback(
    async (workout: Workout) => {
      const workouts = stateRef.current.workouts.some((w) => w.id === workout.id)
        ? stateRef.current.workouts.map((w) => (w.id === workout.id ? workout : w))
        : [workout, ...stateRef.current.workouts];
      dispatch({ type: 'set', payload: { workouts } });
      await persistLocal({ workouts });
      await enqueue('workouts', workout.id, workout);
    },
    [enqueue, persistLocal],
  );

  const patchWorkout = useCallback(
    async (workoutId: string, fn: (w: Workout) => Workout) => {
      const current = stateRef.current.workouts.find((w) => w.id === workoutId);
      if (!current) return;
      const next = fn({ ...current, updatedAt: Date.now() });
      await saveWorkout(next);
    },
    [saveWorkout],
  );

  const api = useMemo<Api>(() => {
    const catalog = [...CATALOG, ...state.customExercises.map(normalizeCatalogExercise)];
    return {
      ...state,
      catalog,
      async signIn(email, password) {
        await authWithPassword('/api/auth/login', email, password, dispatch);
      },
      async signUp(email, password) {
        await authWithPassword('/api/auth/signup', email, password, dispatch);
      },
      async signOut() {
        await db?.auth.signOut();
      },
      todayWorkout() {
        const day = todayKey();
        return state.workouts.find((w) => w.date === day && w.status === 'active')
          ?? state.workouts.find((w) => w.date === day);
      },
      async startToday() {
        const existing = stateRef.current.workouts.find(
          (w) => w.date === todayKey() && w.status === 'active',
        );
        if (existing) return existing;
        const workout: Workout = {
          id: uid('wo'),
          date: todayKey(),
          status: 'active',
          startedAt: Date.now(),
          updatedAt: Date.now(),
          exercises: [],
        };
        await saveWorkout(workout);
        return workout;
      },
      async finishWorkout(workoutId) {
        await patchWorkout(workoutId, (w) => ({
          ...w,
          status: 'finished',
          finishedAt: Date.now(),
        }));
      },
      async addExercise(workoutId, exerciseId) {
        await patchWorkout(workoutId, (w) => {
          if (w.exercises.some((e) => e.exerciseId === exerciseId)) return w;
          const block: WorkoutExercise = { id: uid('ex'), exerciseId, sets: [] };
          return { ...w, exercises: [...w.exercises, block] };
        });
      },
      async removeExercise(workoutId, blockId) {
        await patchWorkout(workoutId, (w) => ({
          ...w,
          exercises: w.exercises.filter((e) => e.id !== blockId),
        }));
      },
      async addSet(workoutId, blockId, partial) {
        await patchWorkout(workoutId, (w) => ({
          ...w,
          exercises: w.exercises.map((e) => {
            if (e.id !== blockId) return e;
            const last = [...e.sets].reverse()[0];
            const prior = lastSessionForExercise(stateRef.current.workouts, e.exerciseId, workoutId);
            const suggestion = prior
              ? suggestNextLoad(prior.block.sets, stateRef.current.profile.unit)
              : undefined;
            const priorWorking = prior?.block.sets.filter((s) => !s.warmup).at(-1);
            const set: LoggedSet = {
              id: uid('set'),
              weight: partial?.weight ?? last?.weight ?? suggestion?.weight ?? priorWorking?.weight ?? 0,
              reps: partial?.reps ?? last?.reps ?? priorWorking?.reps ?? 8,
              rpe: partial?.rpe ?? null,
              notes: partial?.notes ?? '',
              warmup: partial?.warmup ?? false,
              completedAt: Date.now(),
            };
            return { ...e, sets: [...e.sets, set] };
          }),
        }));
      },
      async updateSet(workoutId, blockId, setId, patch) {
        await patchWorkout(workoutId, (w) => ({
          ...w,
          exercises: w.exercises.map((e) =>
            e.id !== blockId
              ? e
              : {
                  ...e,
                  sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
                },
          ),
        }));
      },
      async duplicateLastSet(workoutId, blockId) {
        await patchWorkout(workoutId, (w) => ({
          ...w,
          exercises: w.exercises.map((e) => {
            if (e.id !== blockId) return e;
            const last = e.sets.at(-1);
            if (!last) return e;
            return {
              ...e,
              sets: [
                ...e.sets,
                { ...last, id: uid('set'), completedAt: Date.now() },
              ],
            };
          }),
        }));
      },
      async deleteSet(workoutId, blockId, setId) {
        await patchWorkout(workoutId, (w) => ({
          ...w,
          exercises: w.exercises.map((e) =>
            e.id !== blockId ? e : { ...e, sets: e.sets.filter((s) => s.id !== setId) },
          ),
        }));
      },
      async toggleFavorite(exerciseId) {
        const on = !stateRef.current.favorites.includes(exerciseId);
        const favorites = on
          ? [...stateRef.current.favorites, exerciseId]
          : stateRef.current.favorites.filter((id) => id !== exerciseId);
        dispatch({ type: 'set', payload: { favorites } });
        await persistLocal({ favorites });
        await enqueue(
          'favorites',
          `${stateRef.current.user?.id}_${exerciseId}`,
          { starred: on, updatedAt: Date.now(), exerciseId },
          !on,
        );
      },
      async saveCustomExercise(ex) {
        const prior = ex.id
          ? stateRef.current.customExercises.find((e) => e.id === ex.id)
          : undefined;
        const row: CatalogExercise = {
          ...prior,
          ...ex,
          id: ex.id ?? prior?.id ?? uid(),
          custom: true,
          updatedAt: Date.now(),
        };
        const customExercises = [
          ...stateRef.current.customExercises.filter((e) => e.id !== row.id),
          row,
        ];
        dispatch({ type: 'set', payload: { customExercises } });
        await persistLocal({ customExercises });
        await enqueue('customExercises', row.id, row);
        return row;
      },
      async requestPromote(exerciseId, note) {
        const existing = stateRef.current.customExercises.find((e) => e.id === exerciseId);
        if (!existing) return null;
        const row: CatalogExercise = {
          ...existing,
          promoteRequestedAt: existing.promoteRequestedAt ?? Date.now(),
          promoteStatus: existing.promoteStatus === 'submitted' ? 'submitted' : 'requested',
          promoteNote: note?.trim() ? note.trim() : existing.promoteNote,
          updatedAt: Date.now(),
          custom: true,
        };
        const customExercises = [
          ...stateRef.current.customExercises.filter((e) => e.id !== row.id),
          row,
        ];
        dispatch({ type: 'set', payload: { customExercises } });
        await persistLocal({ customExercises });
        await enqueue('customExercises', row.id, row);
        return row;
      },
      async saveGoal(goal) {
        const goals = [
          ...stateRef.current.goals.filter((g) => g.id !== goal.id),
          { ...goal, updatedAt: Date.now() },
        ];
        dispatch({ type: 'set', payload: { goals } });
        await persistLocal({ goals });
        await enqueue('goals', goal.id, goals.find((g) => g.id === goal.id));
      },
      async deleteGoal(id) {
        const goals = stateRef.current.goals.filter((g) => g.id !== id);
        dispatch({ type: 'set', payload: { goals } });
        await persistLocal({ goals });
        await enqueue('goals', id, {}, true);
      },
      async setUnit(unit) {
        const profile = { unit, updatedAt: Date.now() };
        dispatch({ type: 'set', payload: { profile } });
        await persistLocal({ profile });
        await enqueue('profile', stateRef.current.user?.id ?? 'main', profile);
      },
      saveWorkout,
    };
  }, [enqueue, persistLocal, saveWorkout, patchWorkout, state]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp outside provider');
  return ctx;
}
