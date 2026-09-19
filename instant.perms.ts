const perms = {
  workouts: {
    allow: {
      view: "auth.id in data.ref('owner.id')",
      create: 'auth.id != null',
      update: "auth.id in data.ref('owner.id')",
      delete: "auth.id in data.ref('owner.id')",
    },
  },
  goals: {
    allow: {
      view: "auth.id in data.ref('owner.id')",
      create: 'auth.id != null',
      update: "auth.id in data.ref('owner.id')",
      delete: "auth.id in data.ref('owner.id')",
    },
  },
  customExercises: {
    allow: {
      view: "auth.id in data.ref('owner.id')",
      create: 'auth.id != null',
      update: "auth.id in data.ref('owner.id')",
      delete: "auth.id in data.ref('owner.id')",
    },
  },
  favorites: {
    allow: {
      view: "auth.id in data.ref('owner.id')",
      create: 'auth.id != null',
      update: "auth.id in data.ref('owner.id')",
      delete: "auth.id in data.ref('owner.id')",
    },
  },
  profiles: {
    allow: {
      view: "auth.id in data.ref('owner.id')",
      create: 'auth.id != null',
      update: "auth.id in data.ref('owner.id')",
      delete: "auth.id in data.ref('owner.id')",
    },
  },
  accounts: {
    allow: {
      view: 'false',
      create: 'false',
      update: 'false',
      delete: 'false',
    },
  },
};

export default perms;
