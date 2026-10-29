import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { today } from '../utils/format';
import Toast from '../components/Toast';
import type { ServiceRecord, ExpenseRecord } from '../types';

export default function ServiceFormPage() {
  const [searchParams] = useSearchParams();
  const defaultAcId = searchParams.get('ac') ?? '';
  const { units, addService, addExpense } = useData();
  const navigate = useNavigate();

  const [acId, setAcId] = useState(defaultAcId || (units[0]?.id ?? ''));
  const [serviceDate, setServiceDate] = useState(today());
  const [serviceType, setServiceType] = useState('Annual Service');
  const [techName, setTechName] = useState('');
  const [techContact, setTechContact] = useState('');
  const [notes, setNotes] = useState('');
  const [labourCost, setLabourCost] = useState(0);
  const [partsCost, setPartsCost] = useState(0);
  const [otherCost, setOtherCost] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const SERVICE_TYPES = [
    'Annual Service', 'Gas Top-up', 'Filter Cleaning', 'Coil Cleaning',
    'Drain Cleaning', 'PCB Repair', 'Compressor Check', 'General Repair', 'Other',
  ];

  function validate() {
    const e: Record<string, string> = {};
    if (!acId) e.acId = 'Select an AC.';
    if (!serviceDate) e.serviceDate = 'Service date required.';
    if (!serviceType.trim()) e.serviceType = 'Service type required.';
    if (labourCost < 0) e.labourCost = 'Cannot be negative.';
    if (partsCost < 0) e.partsCost = 'Cannot be negative.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const svcId = `svc-${Date.now()}`;
    const record: ServiceRecord = {
      id: svcId,
      acId,
      serviceDate,
      technicianName: techName.trim() || undefined,
      technicianContact: techContact.trim() || undefined,
      serviceType: serviceType.trim(),
      notes: notes.trim() || undefined,
      labourCost: Number(labourCost),
      partsCost: Number(partsCost),
      otherCost: Number(otherCost),
      createdAt: today(),
    };
    addService(record);

    // Auto-create expense entries to avoid double-counting
    const total = Number(labourCost) + Number(partsCost) + Number(otherCost);
    if (total > 0) {
      if (Number(labourCost) > 0) {
        addExpense({
          id: `exp-${Date.now()}-l`,
          acId, date: serviceDate,
          category: 'maintenance',
          description: `${serviceType} — labour`,
          amount: Number(labourCost),
          serviceRecordId: svcId,
          createdAt: today(),
        } as ExpenseRecord);
      }
      if (Number(partsCost) > 0) {
        addExpense({
          id: `exp-${Date.now()}-p`,
          acId, date: serviceDate,
          category: 'parts',
          description: `${serviceType} — parts`,
          amount: Number(partsCost),
          serviceRecordId: svcId,
          createdAt: today(),
        } as ExpenseRecord);
      }
      if (Number(otherCost) > 0) {
        addExpense({
          id: `exp-${Date.now()}-o`,
          acId, date: serviceDate,
          category: 'other',
          description: `${serviceType} — other`,
          amount: Number(otherCost),
          serviceRecordId: svcId,
          createdAt: today(),
        } as ExpenseRecord);
      }
    }

    setToast({ msg: 'Service record saved.', type: 'success' });
    setTimeout(() => navigate('/maintenance'), 800);
  }

  const totalCost = Number(labourCost) + Number(partsCost) + Number(otherCost);

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-800">Record Service</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-600 border-b pb-2">Service Details</h2>

          <div>
            <label className="form-label">AC <span className="text-red-500">*</span></label>
            <select className="form-select" value={acId} onChange={e => setAcId(e.target.value)}>
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            {errors.acId && <p className="text-xs text-red-600 mt-0.5">{errors.acId}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Service Date <span className="text-red-500">*</span></label>
              <input type="date" className="form-input" value={serviceDate} onChange={e => setServiceDate(e.target.value)} />
              {errors.serviceDate && <p className="text-xs text-red-600 mt-0.5">{errors.serviceDate}</p>}
            </div>
            <div>
              <label className="form-label">Service Type <span className="text-red-500">*</span></label>
              <input list="svc-types" className="form-input" value={serviceType} onChange={e => setServiceType(e.target.value)} />
              <datalist id="svc-types">
                {SERVICE_TYPES.map(t => <option key={t} value={t} />)}
              </datalist>
              {errors.serviceType && <p className="text-xs text-red-600 mt-0.5">{errors.serviceType}</p>}
            </div>
            <div>
              <label className="form-label">Technician Name</label>
              <input className="form-input" value={techName} onChange={e => setTechName(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Technician Contact</label>
              <input className="form-input" value={techContact} onChange={e => setTechContact(e.target.value)} placeholder="Phone number" />
            </div>
          </div>

          <div>
            <label className="form-label">Notes / Observations</label>
            <textarea className="form-textarea" rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-600 border-b pb-2">Costs (₹)</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Labour Cost</label>
              <input type="number" min={0} className="form-input" value={labourCost}
                onChange={e => setLabourCost(parseFloat(e.target.value) || 0)} />
              {errors.labourCost && <p className="text-xs text-red-600 mt-0.5">{errors.labourCost}</p>}
            </div>
            <div>
              <label className="form-label">Parts Cost</label>
              <input type="number" min={0} className="form-input" value={partsCost}
                onChange={e => setPartsCost(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="form-label">Other Cost</label>
              <input type="number" min={0} className="form-input" value={otherCost}
                onChange={e => setOtherCost(parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div className="bg-gray-50 rounded px-3 py-2 flex justify-between text-sm">
            <span className="text-gray-600">Total cost</span>
            <span className="font-semibold">₹{totalCost.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-xs text-gray-400">Expense records will be created automatically from these entries to avoid double-counting.</p>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary">Save Service Record</button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
        </div>
      </form>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
