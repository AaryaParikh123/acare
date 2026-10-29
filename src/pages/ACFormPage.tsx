import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import Toast from '../components/Toast';
import type { ACUnit, InverterType, ACType } from '../types';
import { today } from '../utils/format';

const BRANDS = ['Daikin', 'Voltas', 'Blue Star', 'Carrier', 'LG', 'Samsung', 'Hitachi', 'Panasonic', 'Godrej', 'Whirlpool', 'Other'];
const AC_TYPES: ACType[] = ['split', 'window', 'cassette', 'portable', 'central'];

function emptyForm(): Partial<ACUnit> {
  return {
    name: '', brand: '', model: '', serialNumber: '',
    capacityTons: 1.5, inverterType: 'inverter', acType: 'split',
    refrigerant: '', location: '',
    purchaseDate: today(), purchasePrice: 0, installationCost: 0,
    warrantyStart: '', warrantyEnd: '',
    ratedPowerWatts: undefined, notes: '',
  };
}

export default function ACFormPage() {
  const { id } = useParams();
  const { units, addUnit, updateUnit } = useData();
  const navigate = useNavigate();
  const isEdit = !!id;
  const existing = isEdit ? units.find(u => u.id === id) : undefined;

  const [form, setForm] = useState<Partial<ACUnit>>(existing ?? emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function set(field: keyof ACUnit, value: string | number) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => { const n = { ...e }; delete n[field as string]; return n; });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name?.trim()) e.name = 'Name is required.';
    if (!form.brand?.trim()) e.brand = 'Brand is required.';
    if (!form.model?.trim()) e.model = 'Model is required.';
    if (!form.location?.trim()) e.location = 'Location is required.';
    if (!form.purchaseDate) e.purchaseDate = 'Purchase date is required.';
    if (!form.capacityTons || form.capacityTons <= 0) e.capacityTons = 'Enter a valid capacity.';
    if (form.purchasePrice === undefined || form.purchasePrice < 0) e.purchasePrice = 'Enter a valid price (0 or more).';
    if (form.installationCost === undefined || form.installationCost < 0) e.installationCost = 'Enter a valid amount.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const unit: ACUnit = {
      id: existing?.id ?? `ac-${Date.now()}`,
      name: form.name!.trim(),
      brand: form.brand!.trim(),
      model: form.model!.trim(),
      serialNumber: form.serialNumber?.trim() || undefined,
      capacityTons: Number(form.capacityTons),
      inverterType: form.inverterType as InverterType,
      acType: form.acType as ACType,
      refrigerant: form.refrigerant?.trim() || undefined,
      location: form.location!.trim(),
      purchaseDate: form.purchaseDate!,
      purchasePrice: Number(form.purchasePrice),
      installationCost: Number(form.installationCost),
      warrantyStart: form.warrantyStart || undefined,
      warrantyEnd: form.warrantyEnd || undefined,
      ratedPowerWatts: form.ratedPowerWatts ? Number(form.ratedPowerWatts) : undefined,
      notes: form.notes?.trim() || undefined,
      createdAt: existing?.createdAt ?? today(),
    };

    if (isEdit) updateUnit(unit);
    else addUnit(unit);
    setToast({ msg: isEdit ? 'AC updated.' : 'AC added.', type: 'success' });
    setTimeout(() => navigate(`/acs/${unit.id}`), 800);
  }

  function err(f: string) {
    return errors[f] ? <p className="text-xs text-red-600 mt-0.5">{errors[f]}</p> : null;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit AC' : 'Add New AC'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic info */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-600 border-b pb-2">Basic Information</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">AC Name <span className="text-red-500">*</span></label>
              <input className="form-input" value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Living Room AC" />
              {err('name')}
            </div>
            <div>
              <label className="form-label">Location / Room <span className="text-red-500">*</span></label>
              <input className="form-input" value={form.location ?? ''} onChange={e => set('location', e.target.value)} placeholder="e.g. Master Bedroom" />
              {err('location')}
            </div>
            <div>
              <label className="form-label">Brand <span className="text-red-500">*</span></label>
              <input list="brands-list" className="form-input" value={form.brand ?? ''} onChange={e => set('brand', e.target.value)} />
              <datalist id="brands-list">{BRANDS.map(b => <option key={b} value={b} />)}</datalist>
              {err('brand')}
            </div>
            <div>
              <label className="form-label">Model <span className="text-red-500">*</span></label>
              <input className="form-input" value={form.model ?? ''} onChange={e => set('model', e.target.value)} placeholder="e.g. FTKF50TV" />
              {err('model')}
            </div>
            <div>
              <label className="form-label">Serial Number (optional)</label>
              <input className="form-input" value={form.serialNumber ?? ''} onChange={e => set('serialNumber', e.target.value)} />
            </div>
            <div>
              <label className="form-label">AC Type</label>
              <select className="form-select" value={form.acType ?? 'split'} onChange={e => set('acType', e.target.value)}>
                {AC_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Technical specs */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-600 border-b pb-2">Technical Specifications</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Capacity (tons) <span className="text-red-500">*</span></label>
              <input type="number" step="0.25" min="0.5" max="5" className="form-input"
                value={form.capacityTons ?? ''} onChange={e => set('capacityTons', parseFloat(e.target.value))} />
              {err('capacityTons')}
            </div>
            <div>
              <label className="form-label">Inverter Type</label>
              <select className="form-select" value={form.inverterType ?? 'inverter'} onChange={e => set('inverterType', e.target.value)}>
                <option value="inverter">Inverter</option>
                <option value="non-inverter">Non-Inverter</option>
              </select>
            </div>
            <div>
              <label className="form-label">Refrigerant (optional)</label>
              <input list="ref-list" className="form-input" value={form.refrigerant ?? ''} onChange={e => set('refrigerant', e.target.value)} placeholder="e.g. R-32, R-410A" />
              <datalist id="ref-list">
                <option value="R-32" /><option value="R-410A" /><option value="R-22" /><option value="R-290" />
              </datalist>
            </div>
            <div>
              <label className="form-label">Rated Input Power (W, optional)</label>
              <input type="number" min="0" className="form-input"
                value={form.ratedPowerWatts ?? ''} onChange={e => set('ratedPowerWatts', parseInt(e.target.value))} placeholder="e.g. 1480" />
            </div>
          </div>
        </div>

        {/* Purchase info */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-600 border-b pb-2">Purchase & Cost</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Purchase Date <span className="text-red-500">*</span></label>
              <input type="date" className="form-input" value={form.purchaseDate ?? ''} onChange={e => set('purchaseDate', e.target.value)} />
              {err('purchaseDate')}
            </div>
            <div>
              <label className="form-label">Purchase Price (₹) <span className="text-red-500">*</span></label>
              <input type="number" min="0" className="form-input" value={form.purchasePrice ?? ''} onChange={e => set('purchasePrice', parseFloat(e.target.value))} />
              {err('purchasePrice')}
            </div>
            <div>
              <label className="form-label">Installation Cost (₹) <span className="text-red-500">*</span></label>
              <input type="number" min="0" className="form-input" value={form.installationCost ?? ''} onChange={e => set('installationCost', parseFloat(e.target.value))} />
              {err('installationCost')}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Warranty Start (optional)</label>
              <input type="date" className="form-input" value={form.warrantyStart ?? ''} onChange={e => set('warrantyStart', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Warranty End (optional)</label>
              <input type="date" className="form-input" value={form.warrantyEnd ?? ''} onChange={e => set('warrantyEnd', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <label className="form-label">Notes (optional)</label>
          <textarea className="form-textarea" rows={3} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary">{isEdit ? 'Save changes' : 'Add AC'}</button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
        </div>
      </form>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
