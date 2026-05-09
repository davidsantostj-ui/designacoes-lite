import { createDataProvider } from './dataProvider';

const provider = createDataProvider();

const mockAuth = {
  currentUser: null,
  onAuthStateChanged: (callback) => {
    const unsub = () => {};
    callback(null);
    return unsub;
  },
  signInWithEmailAndPassword: async (email, password) => {
    const user = { uid: Date.now().toString(), email };
    mockAuth.currentUser = user;
    return { user };
  },
  createUserWithEmailAndPassword: async (email, password) => {
    const user = { uid: Date.now().toString(), email };
    mockAuth.currentUser = user;
    return { user };
  },
  signOut: async () => {
    mockAuth.currentUser = null;
  },
  signInAnonymously: async () => {
    const user = { uid: 'anonymous_' + Date.now(), isAnonymous: true };
    mockAuth.currentUser = user;
    return { user };
  },
  deleteUser: async (user) => {
    mockAuth.currentUser = null;
    return Promise.resolve();
  },
  updateProfile: async (user, { displayName }) => {
    user.displayName = displayName;
    return Promise.resolve();
  },
  updatePassword: async (user, password) => {
    return Promise.resolve();
  },
  reauthenticateWithCredential: async (user, cred) => {
    return Promise.resolve(user);
  },
  sendPasswordResetEmail: async (email) => {
    return Promise.resolve();
  },
};

// Firestore mock
const mockDb = {
  collection: (name) => ({
    doc: (id) => ({
      get: async () => ({ exists: false, data: () => ({}) }),
      set: async (data, opts) => Promise.resolve(),
      update: async (data) => Promise.resolve(),
      delete: async () => Promise.resolve(),
    }),
    where: (field, op, value) => ({
      orderBy: (field) => ({
        limit: (n) => ({
          get: async () => ({ empty: true, docs: [] }),
        }),
      }),
    }),
    getDocs: async () => ({ empty: true, docs: [] }),
    addDoc: async (data) => ({ id: Date.now().toString() }),
    orderBy: (field) => ({
      limit: (n) => ({
        get: async () => ({ empty: true, docs: [] }),
      }),
    }),
    writeBatch: () => ({
      set: () => {},
      commit: async () => Promise.resolve(),
    }),
  }),
  getDoc: async (ref) => ({ exists: false, data: () => ({}) }),
  setDoc: async (ref, data, opts) => Promise.resolve(),
  updateDoc: async (ref, data) => Promise.resolve(),
  deleteDoc: async (ref) => Promise.resolve(),
  serverTimestamp: () => ({ toDate: () => new Date() }),
  arrayUnion: (val) => val,
};

// Storage mock
const mockStorage = {
  ref: (path) => ({
    put: async (blob) => Promise.resolve(),
    getDownloadURL: async () => Promise.resolve('https://example.com/file.jpg'),
  }),
};

export const apiProvider = {
  auth: mockAuth,
  db: mockDb,
  storage: mockStorage,
  // Data provider methods
  getUsers: () => provider.getUsers(),
  getUser: (id) => provider.getUser(id),
  createUser: (data) => provider.createUser(data),
  updateUser: (id, updates) => provider.updateUser(id, updates),
  getAssignments: () => provider.getAssignments(),
  createAssignment: (data) => provider.createAssignment(data),
  updateAssignment: (id, updates) => provider.updateAssignment(id, updates),
  deleteAssignment: (id) => provider.deleteAssignment(id),
  getMeetings: () => provider.getMeetings(),
  createMeeting: (data) => provider.createMeeting(data),
  getTalks: () => provider.getTalks(),
  getNotifications: () => provider.getNotifications(),
  getAnnouncements: () => provider.getAnnouncements(),
  createAnnouncement: (data) => provider.createAnnouncement(data),
  deleteAnnouncement: (id) => provider.deleteAnnouncement(id),
  getSpecialEvents: () => provider.getSpecialEvents(),
  createSpecialEvent: (data) => provider.createSpecialEvent(data),
  deleteSpecialEvent: (id) => provider.deleteSpecialEvent(id),
  getSwapLogs: () => provider.getSwapLogs(),
  exportAll: () => provider.exportAll(),
  importAll: (data) => provider.importAll(data),
  clearAll: () => provider.clearAll(),
};

// Export Firebase-like functions at top level
export const onAuthStateChanged = mockAuth.onAuthStateChanged;
export const signInWithEmailAndPassword = mockAuth.signInWithEmailAndPassword;
export const createUserWithEmailAndPassword = mockAuth.createUserWithEmailAndPassword;
export const signOut = mockAuth.signOut;
export const signInAnonymously = mockAuth.signInAnonymously;
export const deleteUser = mockAuth.deleteUser;
export const updateProfile = mockAuth.updateProfile;
export const updatePassword = mockAuth.updatePassword;
export const reauthenticateWithCredential = mockAuth.reauthenticateWithCredential;
export const sendPasswordResetEmail = mockAuth.sendPasswordResetEmail;

export const collection = mockDb.collection;
export const getDoc = mockDb.getDoc;
export const getDocs = mockDb.getDocs;
export const addDoc = mockDb.addDoc;
export const updateDoc = mockDb.updateDoc;
export const doc = mockDb.doc;
export const setDoc = mockDb.setDoc;
export const serverTimestamp = mockDb.serverTimestamp;
export const deleteDoc = mockDb.deleteDoc;
export const arrayUnion = mockDb.arrayUnion;
export const writeBatch = mockDb.writeBatch;
export const query = mockDb.where;
export const where = mockDb.where;
export const orderBy = mockDb.orderBy;
export const limit = mockDb.limit;
export const startAfter = mockDb.startAfter;
