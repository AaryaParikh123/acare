import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { formatDate, formatCurrency } from '../utils/format';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import EmptyState from '../components/EmptyState';

export default function ACDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { units, tasks, services, expenses, deleteUnit, completeTask, deleteTask } = useData();
  const navigate = useNavigate();

  const unit = units.find(u => u.id === id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  if (!unit) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">AC not found.</p>
        <Link to="/acs" className="text-accent-600 hover:underline text-sm mt-2 inline-block">← Back to My ACs</Link>
      </div>
    );
  }

  const unitTasks = tasks
    .filter(t => t.acId === id)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const unitServices = services
    .filter(s => s.acId === id)
    .sort((a, b) => b.serviceDate.localeCompare(a.serviceDate));

  const unitExpenses = expenses.filter(e => e.acId === id);

  const totalExpenses = unitExpenses.reduce((s, e) => s + e.amount, 0);
  const maintenanceCost = unitExpenses
    .filter(e => ['maintenance', 'repair', 'parts', 'other'].includes(e.category))
    .reduce((s, e) => s + e.amount, 0);

  const now = new Date();
  const warrantyEnd = unit.warrantyEnd ? new Date(unit.warrantyEnd + 'T00:00:00') : null;
  const warrantyActive = warrantyEnd ? warrantyEnd >= now : false;

  function handleDelete() {
    deleteUnit(unit!.id);
    navigate('/acs');
  }

  function handleCompleteTask(taskId: string) {
    completeTask(taskId);
    setToast({ msg: 'Task marked complete. Next occurrence scheduled.', type: 'success' });
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/acs')} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{unit.name}</h1>
            <p className="text-sm text-gray-500">{unit.brand} {unit.model} · {unit.location}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/acs/${unit.id}/edit`} className="btn-secondary btn-sm">Edit</Link>
          <button onClick={() => setConfirmDelete(true)} className="btn-danger btn-sm">Delete</button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card space-y-2">
          <h2 className="text-sm font-semibold text-gray-600 border-b pb-2">Specifications</h2>
          <InfoRow label="Capacity" value={`${unit.capacityTons} tons`} />
          <InfoRow label="Type" value={`${unit.acType} · ${unit.inverterType}`} />
          {unit.refrigerant && <InfoRow label="Refrigerant" value={unit.refrigerant} />}
          {unit.ratedPowerWatts && <InfoRow label="Rated Power" value={`${unit.ratedPowerWatts} W`} />}
          {unit.serialNumber && <InfoRow label="Serial No." value={unit.serialNumber} />}
        </div>

        <div className="card space-y-2">
          <h2 className="text-sm font-semibold text-gray-600 border-b pb-2">Purchase & Warranty</h2>
          <InfoRow label="Purchase Date" value={formatDate(unit.purchaseDate)} />
          <InfoRow label="Purchase Price" value={formatCurrency(unit.purchasePrice)} />
          <InfoRow label="Installation Cost" value={formatCurrency(unit.installationCost)} />
          <InfoRow label="Warranty Start" value={formatDate(unit.warrantyStart)} />
          <InfoRow
            label="Warranty End"
            value={formatDate(unit.warrantyEnd)}
            badge={warrantyActive ? 'Active' : unit.warrantyEnd ? 'Expired' : undefined}
            badgeClass={warrantyActive ? 'badge-green' : 'badge-gray'}
          />
        </div>

        <div className="card space-y-2">
          <h2 className="text-sm font-semibold text-gray-600 border-b pb-2">Ownership Costs</h2>
          <InfoRow label="Total Recorded Expenses" value={formatCurrency(totalExpenses)} />
          <InfoRow label="Maintenance & Repairs" value={formatCurrency(maintenanceCost)} />
          <Link to={`/maintenance?ac=${id}`} className="text-xs text-accent-600 hover:underline mt-1 inline-block">View expenses →</Link>
        </div>

        {unit.notes && (
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-600 border-b pb-2 mb-2">Notes</h2>
            <p className="text-sm text-gray-700 whitespace-pre-line">{unit.notes}</p>
          </div>
        )}
      </div>

      {/* Maintenance tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Maintenance Tasks</h2>
          <Link to={`/maintenance/task/new?ac=${id}`} className="btn-primary btn-sm">+ Add Task</Link>
        </div>
        {unitTasks.length === 0 ? (
          <EmptyState text="No maintenance tasks for this AC." />
        ) : (
          <div className="space-y-2">
            {unitTasks.map(task => {
              const isOverdue = task.status === 'overdue';
              const isCompleted = task.status === 'completed';
              return (
                <div key={task.id} className={`flex items-center justify-between border rounded px-3 py-2 ${
                  isOverdue ? 'border-red-200 bg-red-50' : isCompleted ? 'border-gray-100 bg-gray-50 opacity-60' : 'border-gray-200'
                }`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500">
                      Due: {formatDate(task.dueDate)}
                      {task.recurrence && ` · Every ${task.recurrence.interval} ${task.recurrence.unit}`}
                      {task.completedDate && ` · Completed: ${formatDate(task.completedDate)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className={isOverdue ? 'badge-red' : isCompleted ? 'badge-gray' : 'badge-blue'}>
                      {isOverdue ? 'Overdue' : isCompleted ? 'Done' : 'Pending'}
                    </span>
                    {!isCompleted && (
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        className="btn-secondary btn-sm"
                      >Complete</button>
                    )}
                    <button
                      onClick={() => { if (confirm('Delete this task?')) deleteTask(task.id); }}
                      className="text-gray-400 hover:text-red-600 text-xs"
                    >✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Service history */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Service History</h2>
          <Link to={`/maintenance/service/new?ac=${id}`} className="btn-primary btn-sm">+ Record Service</Link>
        </div>
        {unitServices.length === 0 ? (
          <EmptyState text="No service records yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Service Type</th>
                  <th className="pb-2 font-medium">Technician</th>
                  <th className="pb-2 font-medium text-right">Labour</th>
                  <th className="pb-2 font-medium text-right">Parts</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {unitServices.map(svc => (
                  <tr key={svc.id} className="border-b border-gray-50">
                    <td className="py-2 text-gray-600">{formatDate(svc.serviceDate)}</td>
                    <td className="py-2 text-gray-800">{svc.serviceType}</td>
                    <td className="py-2 text-gray-500">{svc.technicianName || '—'}</td>
                    <td className="py-2 text-right">{formatCurrency(svc.labourCost)}</td>
                    <td className="py-2 text-right">{formatCurrency(svc.partsCost)}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(svc.labourCost + svc.partsCost + svc.otherCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        message={`Delete "${unit.name}" and all its records? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function InfoRow({ label, value, badge, badgeClass }: {
  label: string; value: string; badge?: string; badgeClass?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800 flex items-center gap-2">
        {value}
        {badge && <span className={badgeClass ?? 'badge-gray'}>{badge}</span>}
      </span>
    </div>
  );
}
