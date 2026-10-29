import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { today } from '../utils/format';
import Toast from '../components/Toast';
import type { ExpenseRecord, ExpenseCategory } from '../types';

const CATEGORIES: ExpenseCategory[] = ['purchase', 'installation', 'maintenance', 'repair', 'parts', 'other'];

export default function ExpenseFormPage() {
  const [searchParams] = useSearchParams();
  const defaultAcId = searchParams.get('ac') ?? '';
  const { units, addExpense } = useData();
  const navigate = useNavigate();

  const [acId, setAcId] = useState(defaultAcId || (units[0]?.id ?? ''));
  const [date, setDate] = useState(today());
  const [category, setCategory] = useState<ExpenseCategory>('maintenance');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function validate() {
    const e: Record<string, string> = {};
    if (!acId) e.acId = 'Select an AC.';
    if (!date) e.date = 'Date required.';
    if (!description.trim()) e.description = 'Description required.';
    if (amount <= 0) e.amount = 'Amount must be greater than 0.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const record: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      acId, date, category,
      description: description.trim(),
      amount: Number(amount),
      createdAt: today(),
    };
    addExpense(record);
    setToast({ msg: 'Expense recorded.', type: 'success' });
    setTimeout(() => navigate('/maintenance?tab=expenses'), 800);
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-800">Add Expense</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="form-label">AC <span className="text-red-500">*</span></label>
          <select className="form-select" value={acId} onChange={e => setAcId(e.target.value)}>
            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          {errors.acId && <p className="text-xs text-red-600 mt-0.5">{errors.acId}</p>}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Date <span className="text-red-500">*</span></label>
            <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
            {errors.date && <p className="text-xs text-red-600 mt-0.5">{errors.date}</p>}
          </div>
          <div>
            <label className="form-label">Category</label>
            <select className="form-select" value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)}>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="form-label">Description <span className="text-red-500">*</span></label>
          <input className="form-input" value={description} onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Replacement capacitor" />
          {errors.description && <p className="text-xs text-red-600 mt-0.5">{errors.description}</p>}
        </div>

        <div>
          <label className="form-label">Amount (₹) <span className="text-red-500">*</span></label>
          <input type="number" min={0} step={1} className="form-input" value={amount || ''}
            onChange={e => setAmount(parseFloat(e.target.value) || 0)} />
          {errors.amount && <p className="text-xs text-red-600 mt-0.5">{errors.amount}</p>}
        </div>

        <p className="text-xs text-gray-400">
          Note: If this expense is related to a service visit already recorded, the service form creates expense entries automatically. Add manual expenses only for standalone costs not linked to a service record.
        </p>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary">Save Expense</button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
        </div>
      </form>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
