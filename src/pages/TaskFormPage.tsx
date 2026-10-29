import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { today } from '../utils/format';
import Toast from '../components/Toast';
import type { MaintenanceTask, RecurrenceUnit } from '../types';

export default function TaskFormPage() {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const defaultAcId = searchParams.get('ac') ?? '';
  const { units, tasks, addTask, updateTask } = useData();
  const navigate = useNavigate();

  const isEdit = Boolean(id);
  const existingTask = isEdit ? tasks.find(t => t.id === id) : undefined;

  const [acId, setAcId] = useState(defaultAcId || (units[0]?.id ?? ''));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(today());
  const [recurring, setRecurring] = useState(false);
  const [interval, setInterval] = useState(3);
  const [unit, setUnit] = useState<RecurrenceUnit>('months');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (existingTask) {
      setAcId(existingTask.acId);
      setTitle(existingTask.title);
      setDescription(existingTask.description || '');
      setDueDate(existingTask.dueDate);
      if (existingTask.recurrence) {
        setRecurring(true);
        setInterval(existingTask.recurrence.interval);
        setUnit(existingTask.recurrence.unit);
      }
    }
  }, [existingTask]);

  function validate() {
    const e: Record<string, string> = {};
    if (!acId) e.acId = 'Select an AC.';
    if (!title.trim()) e.title = 'Title is required.';
    if (!dueDate) e.dueDate = 'Due date is required.';
    if (recurring && (isNaN(interval) || interval < 1)) e.interval = 'Interval must be at least 1.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    if (isEdit && existingTask) {
      const updated: MaintenanceTask = {
        ...existingTask,
        acId,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate,
        recurrence: recurring ? { interval, unit } : undefined,
      };
      updateTask(updated);
      setToast({ msg: 'Task updated successfully.', type: 'success' });
    } else {
      const task: MaintenanceTask = {
        id: `task-${Date.now()}`,
        acId,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate,
        status: 'pending',
        recurrence: recurring ? { interval, unit } : undefined,
        createdAt: today(),
      };
      addTask(task);
      setToast({ msg: 'Task added successfully.', type: 'success' });
    }

    setTimeout(() => navigate('/maintenance'), 800);
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit Maintenance Task' : 'Add Maintenance Task'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="form-label">AC <span className="text-red-500">*</span></label>
          <select className="form-select" value={acId} onChange={e => setAcId(e.target.value)}>
            {units.length === 0 && <option value="">No ACs added yet</option>}
            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          {errors.acId && <p className="text-xs text-red-600 mt-0.5">{errors.acId}</p>}
        </div>

        <div>
          <label className="form-label">Task Title <span className="text-red-500">*</span></label>
          <input className="form-input" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Clean air filter" />
          {errors.title && <p className="text-xs text-red-600 mt-0.5">{errors.title}</p>}
        </div>

        <div>
          <label className="form-label">Description (optional)</label>
          <textarea className="form-textarea" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <div>
          <label className="form-label">Due Date <span className="text-red-500">*</span></label>
          <input type="date" className="form-input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          {errors.dueDate && <p className="text-xs text-red-600 mt-0.5">{errors.dueDate}</p>}
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)}
              className="rounded" />
            <span className="text-sm text-gray-700">Recurring task</span>
          </label>
        </div>

        {recurring && (
          <div className="flex gap-3 items-center bg-gray-50 rounded p-3">
            <span className="text-sm text-gray-600">Every</span>
            <input type="number" min={1} max={365} className="form-input w-20"
              value={interval} onChange={e => setInterval(parseInt(e.target.value) || 1)} />
            <select className="form-select w-32" value={unit} onChange={e => setUnit(e.target.value as RecurrenceUnit)}>
              <option value="days">days</option>
              <option value="weeks">weeks</option>
              <option value="months">months</option>
            </select>
            {errors.interval && <p className="text-xs text-red-600">{errors.interval}</p>}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary">{isEdit ? 'Save Changes' : 'Add Task'}</button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
        </div>
      </form>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
