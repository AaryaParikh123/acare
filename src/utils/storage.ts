/** Browser localStorage helpers for application data and sessions. */

const KEYS = {
  UNITS: 'acare_ac_units',
  TASKS: 'acare_tasks',
  SERVICES: 'acare_service_records',
  EXPENSES: 'acare_expenses',
  USERS: 'acare_users',
  CURRENT_USER: 'acare_current_user',
} as const;

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`[ACare] Failed to parse localStorage key "${key}", returning fallback.`);
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`[ACare] Failed to write to localStorage key "${key}":`, e);
  }
}

// Generic CRUD helpers
function getAll<T>(key: string): T[] {
  return safeRead<T[]>(key, []);
}

function saveAll<T>(key: string, items: T[]): void {
  safeWrite(key, items);
}

// ─── Public API ──────────────────────────────────────────────────────────────

import type {
  ACUnit, MaintenanceTask, ServiceRecord, ExpenseRecord, UserProfile
} from '../types';

// AC Units
export const acStorage = {
  getAll: (): ACUnit[] => getAll<ACUnit>(KEYS.UNITS),
  save: (units: ACUnit[]) => saveAll(KEYS.UNITS, units),
  add: (unit: ACUnit) => {
    const all = acStorage.getAll();
    acStorage.save([...all, unit]);
  },
  update: (updated: ACUnit) => {
    acStorage.save(acStorage.getAll().map(u => u.id === updated.id ? updated : u));
  },
  delete: (id: string) => {
    acStorage.save(acStorage.getAll().filter(u => u.id !== id));
  },
  getById: (id: string): ACUnit | undefined => acStorage.getAll().find(u => u.id === id),
};

// Maintenance Tasks
export const taskStorage = {
  getAll: (): MaintenanceTask[] => getAll<MaintenanceTask>(KEYS.TASKS),
  save: (tasks: MaintenanceTask[]) => saveAll(KEYS.TASKS, tasks),
  add: (task: MaintenanceTask) => {
    taskStorage.save([...taskStorage.getAll(), task]);
  },
  update: (updated: MaintenanceTask) => {
    taskStorage.save(taskStorage.getAll().map(t => t.id === updated.id ? updated : t));
  },
  delete: (id: string) => {
    taskStorage.save(taskStorage.getAll().filter(t => t.id !== id));
  },
  getByAcId: (acId: string): MaintenanceTask[] => taskStorage.getAll().filter(t => t.acId === acId),
};

// Service Records
export const serviceStorage = {
  getAll: (): ServiceRecord[] => getAll<ServiceRecord>(KEYS.SERVICES),
  save: (records: ServiceRecord[]) => saveAll(KEYS.SERVICES, records),
  add: (record: ServiceRecord) => {
    serviceStorage.save([...serviceStorage.getAll(), record]);
  },
  update: (updated: ServiceRecord) => {
    serviceStorage.save(serviceStorage.getAll().map(r => r.id === updated.id ? updated : r));
  },
  delete: (id: string) => {
    serviceStorage.save(serviceStorage.getAll().filter(r => r.id !== id));
  },
  getByAcId: (acId: string): ServiceRecord[] => serviceStorage.getAll().filter(r => r.acId === acId),
};

// Expenses
export const expenseStorage = {
  getAll: (): ExpenseRecord[] => getAll<ExpenseRecord>(KEYS.EXPENSES),
  save: (records: ExpenseRecord[]) => saveAll(KEYS.EXPENSES, records),
  add: (record: ExpenseRecord) => {
    expenseStorage.save([...expenseStorage.getAll(), record]);
  },
  update: (updated: ExpenseRecord) => {
    expenseStorage.save(expenseStorage.getAll().map(r => r.id === updated.id ? updated : r));
  },
  delete: (id: string) => {
    expenseStorage.save(expenseStorage.getAll().filter(r => r.id !== id));
  },
  getByAcId: (acId: string): ExpenseRecord[] => expenseStorage.getAll().filter(r => r.acId === acId),
};

// Users
export const userStorage = {
  getAll: (): UserProfile[] => getAll<UserProfile>(KEYS.USERS),
  save: (users: UserProfile[]) => saveAll(KEYS.USERS, users),
  add: (user: UserProfile) => {
    userStorage.save([...userStorage.getAll(), user]);
  },
  findByEmail: (email: string): UserProfile | undefined =>
    userStorage.getAll().find(u => u.email.toLowerCase() === email.toLowerCase()),
  update: (updated: UserProfile) => {
    userStorage.save(userStorage.getAll().map(u => u.id === updated.id ? updated : u));
  },
};

// Current session
export const sessionStorage_ = {
  getCurrentUserId: (): string | null => localStorage.getItem(KEYS.CURRENT_USER),
  setCurrentUser: (id: string) => localStorage.setItem(KEYS.CURRENT_USER, id),
  clearCurrentUser: () => localStorage.removeItem(KEYS.CURRENT_USER),
};

// Full reset
export function resetAllData(): void {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  localStorage.removeItem('acare_demo_loaded');
}
