export const createDataProvider = (options = {}) => {
  const STORAGE_KEY = {
    USERS: 'mock_users',
    ASSIGNMENTS: 'mock_assignments',
    MEETINGS: 'mock_meetings',
    TALKS: 'mock_talks',
    NOTIFICATIONS: 'mock_notifications',
    ANNOUNCEMENTS: 'mock_announcements',
    SWAP_LOGS: 'mock_swap_logs',
    SPECIAL_EVENTS: 'mock_specialEvents',
  };

  const getInitialData = () => ({
    users: [
      { id: '1', name: 'Administrador', email: 'admin@example.com', role: 'admin', approved: true },
      { id: '2', name: 'João Silva', email: 'joao@example.com', role: 'user', approved: true },
      { id: '3', name: 'Maria Santos', email: 'maria@example.com', role: 'user', approved: true },
    ],
    assignments: [
      {
        id: 'a1',
        userId: '1',
        userName: 'Administrador',
        date: new Date().toISOString().split('T')[0],
        part: 1,
        talkId: null,
        talkTitle: null,
      },
    ],
    meetings: [
      {
        id: 'm1',
        date: new Date().toISOString().split('T')[0],
        theme: 'Revisão Semanal',
        chairman: 'João Silva',
        prayer: 'Maria Santos',
      },
    ],
    talks: [
      { id: 't1', title: 'Como Conhecer a Deus', date: new Date().toISOString().split('T')[0] },
      { id: 't2', title: 'A Palavra de Deus é Viva', date: new Date().toISOString().split('T')[0] },
    ],
    notifications: [],
    announcements: [],
    swapLogs: [],
    specialEvents: [],
  });

  const loadFromStorage = (key, initial) => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  };

  const saveToStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  return {
    async getUsers() {
      return loadFromStorage(STORAGE_KEY.USERS, getInitialData().users);
    },

    async getUser(id) {
      const users = await this.getUsers();
      return users.find((u) => u.id === id) || null;
    },

    async createUser(userData) {
      const users = await this.getUsers();
      const newUser = { id: Date.now().toString(), ...userData };
      users.push(newUser);
      saveToStorage(STORAGE_KEY.USERS, users);
      return newUser;
    },

    async updateUser(id, updates) {
      const users = await this.getUsers();
      const idx = users.findIndex((u) => u.id === id);
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...updates };
        saveToStorage(STORAGE_KEY.USERS, users);
        return users[idx];
      }
      return null;
    },

    async getAssignments() {
      return loadFromStorage(STORAGE_KEY.ASSIGNMENTS, getInitialData().assignments);
    },

    async createAssignment(data) {
      const assignments = await this.getAssignments();
      const newAssignment = { id: Date.now().toString(), ...data };
      assignments.push(newAssignment);
      saveToStorage(STORAGE_KEY.ASSIGNMENTS, assignments);
      return newAssignment;
    },

    async updateAssignment(id, updates) {
      const assignments = await this.getAssignments();
      const idx = assignments.findIndex((a) => a.id === id);
      if (idx >= 0) {
        assignments[idx] = { ...assignments[idx], ...updates };
        saveToStorage(STORAGE_KEY.ASSIGNMENTS, assignments);
        return assignments[idx];
      }
      return null;
    },

    async deleteAssignment(id) {
      const assignments = await this.getAssignments();
      const filtered = assignments.filter((a) => a.id !== id);
      saveToStorage(STORAGE_KEY.ASSIGNMENTS, filtered);
      return id;
    },

    async getMeetings() {
      return loadFromStorage(STORAGE_KEY.MEETINGS, getInitialData().meetings);
    },

    async createMeeting(data) {
      const meetings = await this.getMeetings();
      const newMeeting = { id: Date.now().toString(), ...data };
      meetings.push(newMeeting);
      saveToStorage(STORAGE_KEY.MEETINGS, meetings);
      return newMeeting;
    },

    async getTalks() {
      return loadFromStorage(STORAGE_KEY.TALKS, getInitialData().talks);
    },

    async getNotifications() {
      return loadFromStorage(STORAGE_KEY.NOTIFICATIONS, []);
    },

    async getAnnouncements() {
      return loadFromStorage(STORAGE_KEY.ANNOUNCEMENTS, getInitialData().announcements);
    },

    async createAnnouncement(data) {
      const announcements = await this.getAnnouncements();
      const newAnnouncement = {
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        ...data,
      };
      announcements.push(newAnnouncement);
      saveToStorage(STORAGE_KEY.ANNOUNCEMENTS, announcements);
      return newAnnouncement;
    },

    async deleteAnnouncement(id) {
      const announcements = await this.getAnnouncements();
      const filtered = announcements.filter((a) => a.id !== id);
      saveToStorage(STORAGE_KEY.ANNOUNCEMENTS, filtered);
      return id;
    },

    async getSpecialEvents() {
      return loadFromStorage(STORAGE_KEY.SPECIAL_EVENTS, getInitialData().specialEvents);
    },

    async createSpecialEvent(data) {
      const events = await this.getSpecialEvents();
      const newEvent = { id: Date.now().toString(), ...data };
      events.push(newEvent);
      saveToStorage(STORAGE_KEY.SPECIAL_EVENTS, events);
      return newEvent;
    },

    async deleteSpecialEvent(id) {
      const events = await this.getSpecialEvents();
      const filtered = events.filter((e) => e.id !== id);
      saveToStorage(STORAGE_KEY.SPECIAL_EVENTS, filtered);
      return id;
    },

    async getSwapLogs() {
      return loadFromStorage(STORAGE_KEY.SWAP_LOGS, []);
    },

    clearAll() {
      Object.values(STORAGE_KEY).forEach((key) => localStorage.removeItem(key));
    },

    async exportAll() {
      const data = {};
      for (const [key, storageKey] of Object.entries(STORAGE_KEY)) {
        data[key === 'specialEvents' ? 'specialEvents' : key] = await loadFromStorage(
          storageKey,
          []
        );
      }
      return data;
    },

    async importAll(data) {
      for (const [key, storageKey] of Object.entries(STORAGE_KEY)) {
        const items = data[key] || [];
        saveToStorage(storageKey, items);
      }
    },
  };
};