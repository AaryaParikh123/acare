import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { calcEnergy } from '../utils/calculations';
import { formatCurrency } from '../utils/format';
import { resetAllData } from '../utils/storage';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';

export default function SettingsPage() {
  const { currentUser, updateUser } = useAuth();
  const { units, refresh } = useData();

  // Profile Form state
  const [name, setName] = useState(currentUser?.name || '');
  const [defaultTariff, setDefaultTariff] = useState(currentUser?.tariffPerKwh || 6.5);

  // Energy Calculator state (Section 8)
  const [selectedAcId, setSelectedAcId] = useState<string>('');
  const [calcWatts, setCalcWatts] = useState<number>(1450);
  const [calcHours, setCalcHours] = useState<number>(8);
  const [calcDays, setCalcDays] = useState<number>(30);
  const [calcTariff, setCalcTariff] = useState<number>(currentUser?.tariffPerKwh || 6.5);

  // Feedback states
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Handle AC selection in Energy Calculator
  function handleSelectAc(e: React.ChangeEvent<HTMLSelectElement>) {
    const acId = e.target.value;
    setSelectedAcId(acId);
    if (!acId) return;
    const ac = units.find(u => u.id === acId);
    if (ac && ac.ratedPowerWatts) {
      setCalcWatts(ac.ratedPowerWatts);
    }
  }

  // Energy calculation
  const energyResult = calcEnergy({
    powerWatts: Math.max(0, calcWatts || 0),
    hoursPerDay: Math.max(0, calcHours || 0),
    daysUsed: Math.max(0, calcDays || 0),
    tariffPerKwh: Math.max(0, calcTariff || 0),
  });

  // Save profile
  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    if (!name.trim()) {
      setToast({ msg: 'Name cannot be empty.', type: 'error' });
      return;
    }
    const updated = {
      ...currentUser,
      name: name.trim(),
      tariffPerKwh: Number(defaultTariff) || 6.5,
    };
    updateUser(updated);
    setCalcTariff(Number(defaultTariff) || 6.5);
    setToast({ msg: 'Profile settings saved.', type: 'success' });
  }

  // Clear all data
  function handleClearAllData() {
    resetAllData();
    refresh();
    setShowClearConfirm(false);
    setToast({ msg: 'All locally stored records have been cleared.', type: 'info' });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Settings & Energy Calculator</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your profile, energy calculations, and saved AC records.</p>
      </div>

      {/* Energy Cost Calculator (Section 8) */}
      <div className="card space-y-4">
        <div className="border-b pb-2">
          <h2 className="text-base font-semibold text-gray-800">Energy Cost Calculator</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Estimate electricity consumption and costs for individual ACs or custom power ratings.
          </p>
        </div>

        {units.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs">
            <label className="block font-medium text-gray-700 mb-1">Auto-fill from one of your ACs:</label>
            <select
              className="form-select max-w-xs text-xs"
              value={selectedAcId}
              onChange={handleSelectAc}
            >
              <option value="">-- Choose an AC unit --</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.brand} {u.model} — {u.ratedPowerWatts ? `${u.ratedPowerWatts}W` : 'no wattage recorded'})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Rated Input Power (Watts)</label>
            <input
              type="number"
              min="100"
              max="10000"
              step="50"
              className="form-input"
              value={calcWatts}
              onChange={e => setCalcWatts(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="form-label">Avg. Operating Hours / Day</label>
            <input
              type="number"
              min="0.5"
              max="24"
              step="0.5"
              className="form-input"
              value={calcHours}
              onChange={e => setCalcHours(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="form-label">Days of Use</label>
            <input
              type="number"
              min="1"
              max="365"
              step="1"
              className="form-input"
              value={calcDays}
              onChange={e => setCalcDays(parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="form-label">Tariff (₹ per kWh)</label>
            <input
              type="number"
              min="1"
              max="30"
              step="0.1"
              className="form-input"
              value={calcTariff}
              onChange={e => setCalcTariff(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Calculation Result */}
        <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
          <div className="grid sm:grid-cols-3 gap-4 text-center sm:text-left">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Calculated Energy Consumption</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {energyResult.energyKwh.toFixed(1)} <span className="text-sm font-normal text-gray-600">kWh (Units)</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Estimated Running Cost</p>
              <p className="text-2xl font-bold text-accent-700 mt-1">
                {formatCurrency(energyResult.estimatedCost)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Daily Average</p>
              <p className="text-lg font-semibold text-gray-700 mt-1">
                {formatCurrency(calcDays > 0 ? energyResult.estimatedCost / calcDays : 0)} / day
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-accent-200 text-xs text-gray-600 space-y-1">
            <p className="font-semibold text-gray-700">Formula & Technical Note:</p>
            <p>
              • Energy (kWh) = (Rated Power / 1000) × Hours per day × Days = ({calcWatts} / 1000) × {calcHours} × {calcDays} = <strong>{energyResult.energyKwh.toFixed(1)} kWh</strong>
            </p>
            <p>
              • Estimated Cost = Energy (kWh) × Tariff (₹/kWh) = {energyResult.energyKwh.toFixed(1)} × ₹{calcTariff} = <strong>{formatCurrency(energyResult.estimatedCost)}</strong>
            </p>
            <p className="text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
              ⚠️ <strong>Estimate Limitation:</strong> Actual power consumption of inverter AC units varies continuously depending on ambient outdoor temperature, thermostat setpoint, room thermal insulation, and compressor modulation. Real electricity bills will differ from full rated capacity calculations.
            </p>
          </div>
        </div>
      </div>

      {/* User Preferences Form */}
      <div className="card space-y-4">
        <h2 className="text-base font-semibold text-gray-800 border-b pb-2">Profile & Default Tariff</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
          <div>
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="form-label">Account Email</label>
            <input
              type="email"
              className="form-input bg-gray-100 text-gray-500"
              value={currentUser?.email || ''}
              disabled
            />
          </div>
          <div>
            <label className="form-label">Default Electricity Tariff (₹ per kWh)</label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="50"
              className="form-input"
              value={defaultTariff}
              onChange={e => setDefaultTariff(parseFloat(e.target.value) || 0)}
              required
            />
            <p className="text-xs text-gray-400 mt-1">Used as the default rate in energy and buying calculations.</p>
          </div>
          <button type="submit" className="btn-primary">Save Preferences</button>
        </form>
      </div>

      {/* Data Management */}
      <div className="card space-y-4">
        <h2 className="text-base font-semibold text-gray-800 border-b pb-2">Data Management</h2>
        <p className="text-sm text-gray-600">
          Your AC units, maintenance schedules, service history, and expenses are saved in this browser.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="btn-danger"
          >
            Clear All Saved Data
          </button>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        message="Are you sure you want to clear all data? All registered ACs, maintenance tasks, service records, and expenses will be permanently deleted from this browser."
        confirmLabel="Clear All Data"
        danger
        onConfirm={handleClearAllData}
        onCancel={() => setShowClearConfirm(false)}
      />

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
