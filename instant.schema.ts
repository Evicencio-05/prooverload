import { i } from '@instantdb/react';

const schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
    }),
    workouts: i.entity({
      json: i.json(),
      updatedAt: i.number().indexed(),
    }),
    goals: i.entity({
      json: i.json(),
      updatedAt: i.number().indexed(),
    }),
    customExercises: i.entity({
      json: i.json(),
      updatedAt: i.number().indexed(),
    }),
    favorites: i.entity({
      exerciseId: i.string().indexed(),
      starred: i.boolean(),
      updatedAt: i.number(),
    }),
    profiles: i.entity({
      unit: i.string(),
      updatedAt: i.number(),
    }),
    accounts: i.entity({
      email: i.string().unique().indexed(),
      passwordHash: i.string(),
    }),
  },
  links: {
    workoutOwner: {
      forward: { on: 'workouts', has: 'one', label: 'owner' },
      reverse: { on: '$users', has: 'many', label: 'workouts' },
    },
    goalOwner: {
      forward: { on: 'goals', has: 'one', label: 'owner' },
      reverse: { on: '$users', has: 'many', label: 'goals' },
    },
    customExerciseOwner: {
      forward: { on: 'customExercises', has: 'one', label: 'owner' },
      reverse: { on: '$users', has: 'many', label: 'customExercises' },
    },
    favoriteOwner: {
      forward: { on: 'favorites', has: 'one', label: 'owner' },
      reverse: { on: '$users', has: 'many', label: 'favorites' },
    },
    profileOwner: {
      forward: { on: 'profiles', has: 'one', label: 'owner' },
      reverse: { on: '$users', has: 'one', label: 'profile' },
    },
  },
});

export default schema;
