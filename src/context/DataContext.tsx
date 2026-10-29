import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { ACUnit, MaintenanceTask, ServiceRecord, ExpenseRecord } from '../types';
import {
  acStorage, taskStorage, serviceStorage, expenseStorage
} from '../utils/storage';
import { today } from '../utils/format';

interface DataContextType {
  units: ACUnit[];
  tasks: MaintenanceTask[];
  services: ServiceRecord[];
  expenses: ExpenseRecord[];
  refresh: () => void;
  // AC units
  addUnit: (unit: ACUnit) => void;
  updateUnit: (unit: ACUnit) => void;
  deleteUnit: (id: string) => void;
  // Tasks
  addTask: (task: MaintenanceTask) => void;
  updateTask: (task: MaintenanceTask) => void;
  deleteTask: (id: string) => void;
  completeTask: (taskId: string, completedDate?: string) => void;
  // Services
  addService: (record: ServiceRecord) => void;
  updateService: (record: ServiceRecord) => void;
  deleteService: (id: string) => void;
  // Expenses
  addExpense: (record: ExpenseRecord) => void;
  updateExpense: (record: ExpenseRecord) => void;
  deleteExpense: (id: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [units, setUnits] = useState<ACUnit[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

  const refresh = useCallback(() => {
    // Recompute overdue status on every load
    const rawTasks = taskStorage.getAll();
    const t = today();
    const updatedTasks = rawTasks.map(task => {
      if (task.status === 'completed') return task;
      const overdue = new Date(task.dueDate + 'T00:00:00') < new Date(t + 'T00:00:00');
      return { ...task, status: overdue ? 'overdue' as const : 'pending' as const };
    });
    // Write back if any changed
    const hasChanges = updatedTasks.some((t, i) => t.status !== rawTasks[i].status);
    if (hasChanges) taskStorage.save(updatedTasks);

    setUnits(acStorage.getAll());
    setTasks(updatedTasks);
    setServices(serviceStorage.getAll());
    setExpenses(expenseStorage.getAll());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // AC Units
  const addUnit = (unit: ACUnit) => { acStorage.add(unit); refresh(); };
  const updateUnit = (unit: ACUnit) => { acStorage.update(unit); refresh(); };
  const deleteUnit = (id: string) => {
    acStorage.delete(id);
    // Cascade delete related records
    taskStorage.save(taskStorage.getAll().filter(t => t.acId !== id));
    serviceStorage.save(serviceStorage.getAll().filter(s => s.acId !== id));
    expenseStorage.save(expenseStorage.getAll().filter(e => e.acId !== id));
    refresh();
  };

  // Tasks
  const addTask = (task: MaintenanceTask) => { taskStorage.add(task); refresh(); };
  const updateTask = (task: MaintenanceTask) => { taskStorage.update(task); refresh(); };
  const deleteTask = (id: string) => { taskStorage.delete(id); refresh(); };

  const completeTask = (taskId: string, completedDate?: string) => {
    const task = taskStorage.getAll().find(t => t.id === taskId);
    if (!task) return;
    const doneDate = completedDate || today();
    taskStorage.update({ ...task, status: 'completed', completedDate: doneDate });

    // Create next occurrence if recurring
    if (task.recurrence) {
      const { interval, unit } = task.recurrence;
      let nextDue: string;
      if (unit === 'days') {
        nextDue = new Date(new Date(doneDate + 'T00:00:00').getTime() + interval * 86400000)
          .toISOString().split('T')[0];
      } else if (unit === 'weeks') {
        nextDue = new Date(new Date(doneDate + 'T00:00:00').getTime() + interval * 7 * 86400000)
          .toISOString().split('T')[0];
      } else {
        const d = new Date(doneDate + 'T00:00:00');
        d.setMonth(d.getMonth() + interval);
        nextDue = d.toISOString().split('T')[0];
      }
      const nextTask: MaintenanceTask = {
        ...task,
        id: `task-${Date.now()}`,
        dueDate: nextDue,
        status: 'pending',
        completedDate: undefined,
        createdAt: today(),
      };
      taskStorage.add(nextTask);
    }
    refresh();
  };

  // Services
  const addService = (record: ServiceRecord) => { serviceStorage.add(record); refresh(); };
  const updateService = (record: ServiceRecord) => { serviceStorage.update(record); refresh(); };
  const deleteService = (id: string) => { serviceStorage.delete(id); refresh(); };

  // Expenses
  const addExpense = (record: ExpenseRecord) => { expenseStorage.add(record); refresh(); };
  const updateExpense = (record: ExpenseRecord) => { expenseStorage.update(record); refresh(); };
  const deleteExpense = (id: string) => { expenseStorage.delete(id); refresh(); };

  return (
    <DataContext.Provider value={{
      units, tasks, services, expenses, refresh,
      addUnit, updateUnit, deleteUnit,
      addTask, updateTask, deleteTask, completeTask,
      addService, updateService, deleteService,
      addExpense, updateExpense, deleteExpense,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
