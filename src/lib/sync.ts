import { db } from './instant';
import { instantId } from './ids';
import { outboxAll, outboxPush, outboxRemove } from './idb';
import type { CatalogExercise, Goal, OutboxItem, UserProfile, Workout } from '../types';

export type CloudDump = {
  workouts: Workout[];
  goals: Goal[];
  customExercises: CatalogExercise[];
  favorites: string[];
  profile: UserProfile;
};

function asEntity<T>(raw: unknown, fallback: T): T {
  if (raw && typeof raw === 'object') return raw as T;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export async function writeCloud(
  userId: string,
  item: Omit<OutboxItem, 'id' | 'at'> & { id?: string; at?: number },
): Promise<void> {
  const full: OutboxItem = {
    id: item.id ?? instantId(`${item.collection}:${item.docId}:${item.at ?? Date.now()}`),
    collection: item.collection,
    docId: item.docId,
    payload: item.payload,
    deleted: item.deleted,
    at: item.at ?? Date.now(),
  };
  await outboxPush(full);
  await flushOutbox(userId);
}

export async function flushOutbox(userId: string): Promise<number> {
  if (!db) return 0;
  const items = await outboxAll();
  let flushed = 0;
  for (const item of items) {
    try {
      const tx = chunkToTx(userId, item);
      if (tx) await db.transact(tx);
      await outboxRemove(item.id);
      flushed += 1;
    } catch (err) {
      console.error('ProOverload sync failed', item.collection, item.docId, err);
      break;
    }
  }
  return flushed;
}

function chunkToTx(userId: string, item: OutboxItem) {
  if (!db) return null;
  const ns = item.collection === 'profile' ? 'profiles' : item.collection;
  const row = db.tx[ns][instantId(item.docId)];
  if (item.deleted) return row.delete();
  if (item.collection === 'favorites') {
    const payload = item.payload as { starred?: boolean; updatedAt?: number; exerciseId?: string };
    return row
      .update({
        exerciseId: payload.exerciseId ?? item.docId.replace(`${userId}_`, ''),
        starred: Boolean(payload.starred),
        updatedAt: payload.updatedAt ?? Date.now(),
      })
      .link({ owner: userId });
  }
  if (item.collection === 'profile') {
    const payload = item.payload as UserProfile;
    return row.update({ unit: payload.unit, updatedAt: payload.updatedAt }).link({ owner: userId });
  }
  const payload = item.payload as { updatedAt?: number };
  return row
    .update({
      json: JSON.parse(JSON.stringify(item.payload)) as object,
      updatedAt: payload.updatedAt ?? Date.now(),
    })
    .link({ owner: userId });
}

export function listenUserData(
  _userId: string,
  onData: (partial: Partial<CloudDump>) => void,
): () => void {
  if (!db) return () => {};
  return db.subscribeQuery(
    {
      workouts: {},
      goals: {},
      customExercises: {},
      favorites: {},
      profiles: {},
    },
    (resp) => {
      if (resp.error) return;
      const data = resp.data;
      if (!data) return;
      onData({
        workouts: (data.workouts ?? []).map((row) => asEntity<Workout>(row.json, { id: row.id } as Workout)),
        goals: (data.goals ?? []).map((row) => asEntity<Goal>(row.json, { id: row.id } as Goal)),
        customExercises: (data.customExercises ?? []).map((row) =>
          asEntity<CatalogExercise>(row.json, { id: row.id } as CatalogExercise),
        ),
        favorites: (data.favorites ?? []).filter((row) => row.starred).map((row) => row.exerciseId),
        ...(data.profiles?.[0]
          ? {
              profile: {
                unit: (data.profiles[0].unit === 'lb' ? 'lb' : 'kg') as UserProfile['unit'],
                updatedAt: data.profiles[0].updatedAt,
              },
            }
          : {}),
      });
    },
  );
}
