import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, today } from '../utils/format';

export default function DashboardPage() {
  const { units, tasks, services, expenses } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const t = today();

  // ── Calculations ──────────────────────────────────────────────────────────
  const totalPurchase = expenses
    .filter(e => e.category === 'purchase')
    .reduce((s, e) => s + e.amount, 0);

  const totalInstall = expenses
    .filter(e => e.category === 'installation')
    .reduce((s, e) => s + e.amount, 0);

  const totalMaintenance = expenses
    .filter(e => ['maintenance', 'repair', 'parts', 'other'].includes(e.category))
    .reduce((s, e) => s + e.amount, 0);

  const overdueTasks = tasks.filter(t => t.status === 'overdue');
  const upcomingTasks = tasks.filter(task => {
    if (task.status !== 'pending') return false;
    const diff = Math.ceil((new Date(task.dueDate + 'T00:00:00').getTime() - new Date(t + 'T00:00:00').getTime()) / 86400000);
    return diff >= 0 && diff <= 30;
  }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const recentServices = [...services]
    .sort((a, b) => b.serviceDate.localeCompare(a.serviceDate))
    .slice(0, 5);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function getAcName(acId: string) {
    return units.find(u => u.id === acId)?.name ?? 'Unknown AC';
  }

  function daysLabel(dueDate: string) {
    const diff = Math.ceil((new Date(dueDate + 'T00:00:00').getTime() - new Date(t + 'T00:00:00').getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff > 0) return `in ${diff}d`;
    return `${Math.abs(diff)}d overdue`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, {currentUser?.name}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/acs/new')} className="btn-primary btn-sm">+ Add AC</button>
          <button onClick={() => navigate('/maintenance/service/new')} className="btn-secondary btn-sm">+ Record Service</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Registered ACs" value={units.length.toString()} />
        <SummaryCard label="Purchase & Install" value={formatCurrency(totalPurchase + totalInstall)} />
        <SummaryCard label="Maintenance Costs" value={formatCurrency(totalMaintenance)} sub="recorded expenses" />
        <SummaryCard label="Overdue Tasks" value={overdueTasks.length.toString()} highlight={overdueTasks.length > 0} />
      </div>

      {/* Overdue tasks */}
      {overdueTasks.length > 0 && (
        <div className="card border-red-200 bg-red-50">
          <h2 className="text-sm font-semibold text-red-700 mb-3">⚠ Overdue Maintenance ({overdueTasks.length})</h2>
          <div className="space-y-2">
            {overdueTasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center justify-between bg-white border border-red-100 rounded px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">{task.title}</p>
                  <p className="text-xs text-gray-500">{getAcName(task.acId)} · Due {formatDate(task.dueDate)}</p>
                </div>
                <span className="badge-red">{daysLabel(task.dueDate)}</span>
              </div>
            ))}
          </div>
          <Link to="/maintenance" className="text-xs text-red-600 hover:underline mt-2 inline-block">View all →</Link>
        </div>
      )}

      {/* Upcoming tasks */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Upcoming Tasks (next 30 days)</h2>
        {upcomingTasks.length === 0 ? (
          <p className="text-sm text-gray-400">No upcoming tasks in the next 30 days.</p>
        ) : (
          <div className="space-y-2">
            {upcomingTasks.slice(0, 6).map(task => {
              const diff = Math.ceil((new Date(task.dueDate + 'T00:00:00').getTime() - new Date(t + 'T00:00:00').getTime()) / 86400000);
              return (
                <div key={task.id} className="flex items-center justify-between border border-gray-100 rounded px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{task.title}</p>
                    <p className="text-xs text-gray-500">{getAcName(task.acId)} · Due {formatDate(task.dueDate)}</p>
                  </div>
                  <span className={diff <= 7 ? 'badge-yellow' : 'badge-blue'}>
                    {diff === 0 ? 'Today' : `in ${diff}d`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <Link to="/maintenance" className="text-xs text-accent-600 hover:underline mt-2 inline-block">All tasks →</Link>
      </div>

      {/* Recent services */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Recently Serviced</h2>
        {recentServices.length === 0 ? (
          <p className="text-sm text-gray-400">No service records yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="pb-2 font-medium">AC</th>
                <th className="pb-2 font-medium">Service</th>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {recentServices.map(svc => (
                <tr key={svc.id} className="border-b border-gray-50">
                  <td className="py-2 text-gray-700">{getAcName(svc.acId)}</td>
                  <td className="py-2 text-gray-600">{svc.serviceType}</td>
                  <td className="py-2 text-gray-500">{formatDate(svc.serviceDate)}</td>
                  <td className="py-2 text-right text-gray-700">{formatCurrency(svc.labourCost + svc.partsCost + svc.otherCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* My ACs quick view */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">My ACs</h2>
          <Link to="/acs" className="text-xs text-accent-600 hover:underline">View all →</Link>
        </div>
        {units.length === 0 ? (
          <div className="text-sm text-gray-400">No ACs added yet. <Link to="/acs/new" className="text-accent-600 hover:underline">Add your first AC →</Link></div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {units.slice(0, 6).map(unit => {
              const unitOverdue = tasks.filter(t => t.acId === unit.id && t.status === 'overdue').length;
              return (
                <Link key={unit.id} to={`/acs/${unit.id}`}
                  className="block border border-gray-200 rounded p-3 hover:border-accent-300 hover:bg-accent-50 transition-colors">
                  <p className="font-medium text-sm text-gray-800">{unit.name}</p>
                  <p className="text-xs text-gray-500">{unit.brand} · {unit.capacityTons}T · {unit.location}</p>
                  {unitOverdue > 0 && (
                    <span className="badge-red mt-1">{unitOverdue} overdue</span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, highlight }: {
  label: string; value: string; sub?: string; highlight?: boolean
}) {
  return (
    <div className={`card ${highlight ? 'border-red-200 bg-red-50' : ''}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-red-700' : 'text-gray-800'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
