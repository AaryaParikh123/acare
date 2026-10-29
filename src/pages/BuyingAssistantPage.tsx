import React, { useState } from 'react';
import { calcCoolingLoad, calcEnergy } from '../utils/calculations';
import { formatCurrency } from '../utils/format';
import type { RoomProfile, ACSpec } from '../types';

// Sample AC data — clearly labelled as approximate/illustrative only
const SAMPLE_ACS: ACSpec[] = [
  { id: 's1', brand: 'Daikin', model: 'FTKF35TV', capacityTons: 1.0, inverterType: 'inverter', ratedPowerWatts: 950, price: 35000, starRating: 5, iseel: 4.65, isSample: true, notes: 'Sample data — verify with dealer' },
  { id: 's2', brand: 'Daikin', model: 'FTKF50TV', capacityTons: 1.5, inverterType: 'inverter', ratedPowerWatts: 1480, price: 42000, starRating: 5, iseel: 4.50, isSample: true, notes: 'Sample data — verify with dealer' },
  { id: 's3', brand: 'Voltas', model: '185V DZW', capacityTons: 1.5, inverterType: 'inverter', ratedPowerWatts: 1380, price: 36000, starRating: 3, iseel: 3.60, isSample: true, notes: 'Sample data — verify with dealer' },
  { id: 's4', brand: 'Blue Star', model: '5CNHW18PAFU', capacityTons: 1.5, inverterType: 'inverter', ratedPowerWatts: 1540, price: 38500, starRating: 3, iseel: 3.51, isSample: true, notes: 'Sample data — verify with dealer' },
  { id: 's5', brand: 'LG', model: 'RS-Q18JNXE', capacityTons: 1.5, inverterType: 'inverter', ratedPowerWatts: 1260, price: 41000, starRating: 5, iseel: 4.73, isSample: true, notes: 'Sample data — verify with dealer' },
  { id: 's6', brand: 'Carrier', model: 'CAI18ES3C8F0', capacityTons: 1.5, inverterType: 'inverter', ratedPowerWatts: 1490, price: 37500, starRating: 3, iseel: 3.57, isSample: true, notes: 'Sample data — verify with dealer' },
  { id: 's7', brand: 'Voltas', model: '123 DYe', capacityTons: 1.0, inverterType: 'non-inverter', ratedPowerWatts: 1010, price: 28000, starRating: 3, isSample: true, notes: 'Sample data — verify with dealer' },
  { id: 's8', brand: 'Blue Star', model: 'IC312YATX', capacityTons: 1.0, inverterType: 'non-inverter', ratedPowerWatts: 1100, price: 26000, starRating: 2, isSample: true, notes: 'Sample data — verify with dealer' },
];

const defaultRoom: RoomProfile = {
  lengthM: 4, widthM: 3.5, heightM: 2.7,
  occupants: 2, windows: 2, windowType: 'single',
  sunExposure: 'medium', floorLevel: 'middle',
  heatSources: '',
  budgetMin: 25000, budgetMax: 60000,
  expectedHoursPerDay: 8,
  tariffPerKwh: 6.5,
};

export default function BuyingAssistantPage() {
  const [room, setRoom] = useState<RoomProfile>(defaultRoom);
  const [result, setResult] = useState<ReturnType<typeof calcCoolingLoad> | null>(null);
  const [userACs, setUserACs] = useState<ACSpec[]>([]);
  const [showAddAC, setShowAddAC] = useState(false);
  const [newAC, setNewAC] = useState<Partial<ACSpec>>({ brand: '', model: '', capacityTons: 1.5, inverterType: 'inverter', ratedPowerWatts: 1400, price: 0, isSample: false });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});

  function setR(field: keyof RoomProfile, value: string | number) {
    setRoom(r => ({ ...r, [field]: value }));
  }

  function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setResult(calcCoolingLoad(room));
  }

  function addUserAC() {
    const e: Record<string, string> = {};
    if (!newAC.brand?.trim()) e.brand = 'Required';
    if (!newAC.model?.trim()) e.model = 'Required';
    if (!newAC.capacityTons || newAC.capacityTons <= 0) e.capacityTons = 'Required';
    if (!newAC.ratedPowerWatts || newAC.ratedPowerWatts <= 0) e.ratedPowerWatts = 'Required';
    if (!newAC.price || newAC.price <= 0) e.price = 'Required';
    setAddErrors(e);
    if (Object.keys(e).length > 0) return;

    setUserACs(prev => [...prev, { ...newAC as ACSpec, id: `user-ac-${Date.now()}`, isSample: false }]);
    setNewAC({ brand: '', model: '', capacityTons: 1.5, inverterType: 'inverter', ratedPowerWatts: 1400, price: 0, isSample: false });
    setShowAddAC(false);
  }

  const allACs = [...userACs, ...SAMPLE_ACS];
  const filteredACs = result
    ? allACs.filter(ac => {
        const inRange = ac.capacityTons >= result.minTons - 0.25 && ac.capacityTons <= result.maxTons + 0.25;
        const inBudget = ac.price >= room.budgetMin && ac.price <= room.budgetMax;
        return inRange && inBudget;
      })
    : [];

  function runningCost(ac: ACSpec) {
    return calcEnergy({
      powerWatts: ac.ratedPowerWatts,
      hoursPerDay: room.expectedHoursPerDay,
      daysUsed: 30,
      tariffPerKwh: room.tariffPerKwh,
    });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-gray-800">AC Buying Assistant</h1>
        <p className="text-sm text-gray-500 mt-1">Enter your room details to get an indicative cooling capacity recommendation.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded px-4 py-3 text-sm text-amber-800">
        ⚠️ <strong>Disclaimer:</strong> The cooling load calculation uses standard engineering rules of thumb (BEE / ASHRAE guidelines) and is for guidance only. It does not replace a professional HVAC load analysis. Actual requirements depend on local climate, insulation quality, infiltration and other site-specific factors. Sample AC prices and specifications are illustrative and may not reflect current market data — always verify with dealers.
      </div>

      {/* Room profile form */}
      <form onSubmit={handleCalculate} className="card space-y-5">
        <h2 className="text-sm font-semibold text-gray-600 border-b pb-2">Room Details</h2>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Length (m)</label>
            <input type="number" step="0.1" min="1" className="form-input"
              value={room.lengthM} onChange={e => setR('lengthM', parseFloat(e.target.value))} />
          </div>
          <div>
            <label className="form-label">Width (m)</label>
            <input type="number" step="0.1" min="1" className="form-input"
              value={room.widthM} onChange={e => setR('widthM', parseFloat(e.target.value))} />
          </div>
          <div>
            <label className="form-label">Ceiling Height (m)</label>
            <input type="number" step="0.1" min="2" max="6" className="form-input"
              value={room.heightM} onChange={e => setR('heightM', parseFloat(e.target.value))} />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Occupants</label>
            <input type="number" min="1" max="20" className="form-input"
              value={room.occupants} onChange={e => setR('occupants', parseInt(e.target.value))} />
          </div>
          <div>
            <label className="form-label">Number of Windows</label>
            <input type="number" min="0" max="10" className="form-input"
              value={room.windows} onChange={e => setR('windows', parseInt(e.target.value))} />
          </div>
          <div>
            <label className="form-label">Window Glazing</label>
            <select className="form-select" value={room.windowType} onChange={e => setR('windowType', e.target.value)}>
              <option value="single">Single glazed</option>
              <option value="double">Double glazed</option>
              <option value="none">No windows</option>
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Sunlight Exposure</label>
            <select className="form-select" value={room.sunExposure} onChange={e => setR('sunExposure', e.target.value)}>
              <option value="low">Low (north-facing / shaded)</option>
              <option value="medium">Medium</option>
              <option value="high">High (west/south-facing)</option>
            </select>
          </div>
          <div>
            <label className="form-label">Floor Level</label>
            <select className="form-select" value={room.floorLevel} onChange={e => setR('floorLevel', e.target.value)}>
              <option value="ground">Ground floor</option>
              <option value="middle">Middle floor</option>
              <option value="top">Top floor</option>
            </select>
          </div>
          <div>
            <label className="form-label">Major Heat Sources</label>
            <input className="form-input" placeholder="e.g. kitchen, server equipment"
              value={room.heatSources} onChange={e => setR('heatSources', e.target.value)} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Budget Min (₹)</label>
            <input type="number" min="0" step="1000" className="form-input"
              value={room.budgetMin} onChange={e => setR('budgetMin', parseInt(e.target.value))} />
          </div>
          <div>
            <label className="form-label">Budget Max (₹)</label>
            <input type="number" min="0" step="1000" className="form-input"
              value={room.budgetMax} onChange={e => setR('budgetMax', parseInt(e.target.value))} />
          </div>
          <div>
            <label className="form-label">Expected Operating Hours / Day</label>
            <input type="number" min="1" max="24" className="form-input"
              value={room.expectedHoursPerDay} onChange={e => setR('expectedHoursPerDay', parseFloat(e.target.value))} />
          </div>
          <div>
            <label className="form-label">Electricity Tariff (₹/kWh)</label>
            <input type="number" step="0.1" min="1" max="20" className="form-input"
              value={room.tariffPerKwh} onChange={e => setR('tariffPerKwh', parseFloat(e.target.value))} />
          </div>
        </div>

        <button type="submit" className="btn-primary">Calculate Recommended Capacity</button>
      </form>

      {/* Result */}
      {result && (
        <>
          <div className="card bg-accent-50 border-accent-200">
            <h2 className="text-sm font-semibold text-accent-800 mb-3">Cooling Capacity Estimate</h2>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Room Area</p>
                <p className="font-semibold text-gray-800">{result.areaSqm.toFixed(1)} m²</p>
              </div>
              <div>
                <p className="text-gray-500">Room Volume</p>
                <p className="font-semibold text-gray-800">{result.volumeCubicM.toFixed(1)} m³</p>
              </div>
              <div>
                <p className="text-gray-500">Suggested Range</p>
                <p className="font-bold text-accent-700 text-lg">{result.minTons}–{result.maxTons} tons</p>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500 space-y-1">
              <p><strong>Assumptions used:</strong> Base 0.0667 TR/m² (≈600 BTU/hr·m²). Adjusted for ceiling height, occupants beyond 2, sun exposure, floor level, window count and heat sources. Adds ±10% buffer for selection range.</p>
              <p>This estimate is indicative only. Consider getting a site-specific load calculation for precision cooling.</p>
            </div>
          </div>

          {/* AC comparison */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-700">
                Matching ACs ({filteredACs.length} found)
                <span className="text-xs font-normal text-gray-400 ml-2">within budget and capacity range</span>
              </h2>
              <button onClick={() => setShowAddAC(v => !v)} className="btn-secondary btn-sm">
                + Add AC for comparison
              </button>
            </div>

            {/* Add user AC form */}
            {showAddAC && (
              <div className="card border-accent-200 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Add AC Specification</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="form-label">Brand</label>
                    <input className="form-input" value={newAC.brand ?? ''} onChange={e => setNewAC(p => ({ ...p, brand: e.target.value }))} />
                    {addErrors.brand && <p className="text-xs text-red-600">{addErrors.brand}</p>}
                  </div>
                  <div>
                    <label className="form-label">Model</label>
                    <input className="form-input" value={newAC.model ?? ''} onChange={e => setNewAC(p => ({ ...p, model: e.target.value }))} />
                    {addErrors.model && <p className="text-xs text-red-600">{addErrors.model}</p>}
                  </div>
                  <div>
                    <label className="form-label">Capacity (tons)</label>
                    <input type="number" step="0.25" min="0.5" className="form-input"
                      value={newAC.capacityTons ?? ''} onChange={e => setNewAC(p => ({ ...p, capacityTons: parseFloat(e.target.value) }))} />
                    {addErrors.capacityTons && <p className="text-xs text-red-600">{addErrors.capacityTons}</p>}
                  </div>
                  <div>
                    <label className="form-label">Inverter Type</label>
                    <select className="form-select" value={newAC.inverterType ?? 'inverter'}
                      onChange={e => setNewAC(p => ({ ...p, inverterType: e.target.value as 'inverter' | 'non-inverter' }))}>
                      <option value="inverter">Inverter</option>
                      <option value="non-inverter">Non-Inverter</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Rated Power (W)</label>
                    <input type="number" min="0" className="form-input"
                      value={newAC.ratedPowerWatts ?? ''} onChange={e => setNewAC(p => ({ ...p, ratedPowerWatts: parseInt(e.target.value) }))} />
                    {addErrors.ratedPowerWatts && <p className="text-xs text-red-600">{addErrors.ratedPowerWatts}</p>}
                  </div>
                  <div>
                    <label className="form-label">Price (₹)</label>
                    <input type="number" min="0" className="form-input"
                      value={newAC.price ?? ''} onChange={e => setNewAC(p => ({ ...p, price: parseInt(e.target.value) }))} />
                    {addErrors.price && <p className="text-xs text-red-600">{addErrors.price}</p>}
                  </div>
                  <div>
                    <label className="form-label">Star Rating (optional)</label>
                    <input type="number" min="1" max="5" className="form-input"
                      value={newAC.starRating ?? ''} onChange={e => setNewAC(p => ({ ...p, starRating: parseInt(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="form-label">ISEER (optional)</label>
                    <input type="number" step="0.01" className="form-input"
                      value={newAC.iseel ?? ''} onChange={e => setNewAC(p => ({ ...p, iseel: parseFloat(e.target.value) }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={addUserAC} className="btn-primary btn-sm">Add</button>
                  <button onClick={() => setShowAddAC(false)} className="btn-secondary btn-sm">Cancel</button>
                </div>
              </div>
            )}

            {filteredACs.length === 0 ? (
              <div className="card text-center py-8 text-gray-400 text-sm">
                No ACs found matching your capacity range and budget.
                <br />Try adjusting your budget or check all ACs below.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-left text-xs text-gray-500">
                      <th className="px-3 py-2 font-medium">Brand / Model</th>
                      <th className="px-3 py-2 font-medium">Tons</th>
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2 font-medium">Power (W)</th>
                      <th className="px-3 py-2 font-medium">Stars</th>
                      <th className="px-3 py-2 font-medium">ISEER</th>
                      <th className="px-3 py-2 font-medium text-right">Price</th>
                      <th className="px-3 py-2 font-medium text-right">Est. 30-day cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredACs.sort((a, b) => a.price - b.price).map(ac => {
                      const cost30 = runningCost(ac);
                      return (
                        <tr key={ac.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <p className="font-medium text-gray-800">{ac.brand} {ac.model}</p>
                            {ac.isSample && <span className="badge-gray text-[10px]">Sample data</span>}
                          </td>
                          <td className="px-3 py-2 text-gray-700">{ac.capacityTons}T</td>
                          <td className="px-3 py-2">
                            <span className={ac.inverterType === 'inverter' ? 'badge-green' : 'badge-gray'}>
                              {ac.inverterType === 'inverter' ? 'Inverter' : 'Non-inv.'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-700">{ac.ratedPowerWatts}</td>
                          <td className="px-3 py-2 text-gray-700">{ac.starRating ? '★'.repeat(ac.starRating) : '—'}</td>
                          <td className="px-3 py-2 text-gray-700">{ac.iseel ?? '—'}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(ac.price)}</td>
                          <td className="px-3 py-2 text-right">
                            <p className="font-medium">{formatCurrency(cost30.estimatedCost)}</p>
                            <p className="text-xs text-gray-400">{cost30.energyKwh.toFixed(0)} kWh</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-xs text-gray-400 space-y-1">
              <p>* Estimated 30-day running cost = Rated power × {room.expectedHoursPerDay}h/day × 30 days × ₹{room.tariffPerKwh}/kWh. Inverter ACs vary; actual consumption may be 20–50% lower under partial load.</p>
              <p>* ISEER = Indian Seasonal Energy Efficiency Ratio (higher is better). Mandatory BEE star ratings apply.</p>
              <p>* All sample data is approximate and for educational comparison only. Prices reflect approximate 2024 market estimates.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
