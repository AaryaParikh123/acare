import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { formatDate, formatCurrency } from '../utils/format';
import EmptyState from '../components/EmptyState';
import type { ACUnit } from '../types';

export default function ACListPage() {
  const { units, tasks } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'inverter' | 'non-inverter'>('all');

  const filtered = units.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      u.name.toLowerCase().includes(q) ||
      u.brand.toLowerCase().includes(q) ||
      u.model.toLowerCase().includes(q) ||
      u.location.toLowerCase().includes(q);
    const matchType = filterType === 'all' || u.inverterType === filterType;
    return matchSearch && matchType;
  });

  function overdueCount(acId: string) {
    return tasks.filter(t => t.acId === acId && t.status === 'overdue').length;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">My ACs</h1>
        <button onClick={() => navigate('/acs/new')} className="btn-primary">+ Add AC</button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Search by name, brand, model or location…"
          className="form-input flex-1"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="form-select w-auto"
          value={filterType}
          onChange={e => setFilterType(e.target.value as typeof filterType)}
        >
          <option value="all">All types</option>
          <option value="inverter">Inverter</option>
          <option value="non-inverter">Non-inverter</option>
        </select>
      </div>

      {units.length === 0 ? (
        <div className="card">
          <EmptyState text="No ACs added yet. Click '+ Add AC' to get started." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState text="No ACs match your search." /></div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map(unit => (
            <ACCard key={unit.id} unit={unit} overdue={overdueCount(unit.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ACCard({ unit, overdue }: { unit: ACUnit; overdue: number }) {
  const now = new Date();
  const warrantyEnd = unit.warrantyEnd ? new Date(unit.warrantyEnd + 'T00:00:00') : null;
  const warrantyExpired = warrantyEnd ? warrantyEnd < now : true;
  const warrantyExpiringSoon = warrantyEnd
    ? !warrantyExpired && (warrantyEnd.getTime() - now.getTime()) < 90 * 86400000
    : false;

  return (
    <Link to={`/acs/${unit.id}`}
      className="card block hover:border-accent-300 hover:bg-accent-50 transition-colors group">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-800 group-hover:text-accent-700">{unit.name}</p>
          <p className="text-xs text-gray-500">{unit.brand} {unit.model}</p>
        </div>
        <span className={unit.inverterType === 'inverter' ? 'badge-green' : 'badge-gray'}>
          {unit.inverterType === 'inverter' ? 'Inverter' : 'Non-inv.'}
        </span>
      </div>

      <div className="text-xs text-gray-600 space-y-1 mt-3">
        <div className="flex justify-between">
          <span>Capacity</span>
          <span className="font-medium">{unit.capacityTons} tons</span>
        </div>
        <div className="flex justify-between">
          <span>Location</span>
          <span className="font-medium">{unit.location}</span>
        </div>
        <div className="flex justify-between">
          <span>Purchased</span>
          <span>{formatDate(unit.purchaseDate)}</span>
        </div>
        <div className="flex justify-between">
          <span>Purchase price</span>
          <span>{formatCurrency(unit.purchasePrice)}</span>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap mt-3">
        {overdue > 0 && <span className="badge-red">{overdue} overdue</span>}
        {warrantyExpiringSoon && <span className="badge-yellow">Warranty expiring</span>}
        {warrantyExpired && unit.warrantyEnd && <span className="badge-gray">Warranty expired</span>}
      </div>
    </Link>
  );
}
