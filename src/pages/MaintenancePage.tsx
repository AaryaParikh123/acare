import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { formatDate, formatCurrency, today } from '../utils/format';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';

type Tab = 'tasks' | 'services' | 'expenses';

export default function MaintenancePage() {
  const [searchParams] = useSearchParams();
  const acFilter = searchParams.get('ac') ?? 'all';
  const { units, tasks, services, expenses, completeTask, deleteTask, deleteService, deleteExpense } = useData();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('tasks');
  const [filterAc, setFilterAc] = useState<string>(acFilter);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmType, setConfirmType] = useState<'task' | 'service' | 'expense'>('task');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function getAcName(acId: string) {
    return units.find(u => u.id === acId)?.name ?? 'Unknown';
  }

  const filteredTasks = tasks
    .filter(t => filterAc === 'all' || t.acId === filterAc)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const filteredServices = services
    .filter(s => filterAc === 'all' || s.acId === filterAc)
    .sort((a, b) => b.serviceDate.localeCompare(a.serviceDate));

  const filteredExpenses = expenses
    .filter(e => filterAc === 'all' || e.acId === filterAc)
    .sort((a, b) => b.date.localeCompare(a.date));

  const overdueTasks = filteredTasks.filter(t => t.status === 'overdue');
  const pendingTasks = filteredTasks.filter(t => t.status === 'pending');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const totalServices = filteredServices.reduce((s, svc) => s + svc.labourCost + svc.partsCost + svc.otherCost, 0);

  function handleComplete(taskId: string) {
    completeTask(taskId);
    setToast({ msg: 'Task marked complete.', type: 'success' });
  }

  function doDelete() {
    if (!confirmId) return;
    if (confirmType === 'task') deleteTask(confirmId);
    else if (confirmType === 'service') deleteService(confirmId);
    else deleteExpense(confirmId);
    setConfirmId(null);
    setToast({ msg: 'Record deleted.', type: 'success' });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-800">Maintenance & Expenses</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => navigate('/maintenance/task/new')} className="btn-secondary btn-sm">+ Add Task</button>
          <button onClick={() => navigate('/maintenance/service/new')} className="btn-primary btn-sm">+ Record Service</button>
          <button onClick={() => navigate('/maintenance/expense/new')} className="btn-secondary btn-sm">+ Add Expense</button>
        </div>
      </div>

      {/* AC filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">Filter by AC:</label>
        <select className="form-select w-auto" value={filterAc} onChange={e => setFilterAc(e.target.value)}>
          <option value="all">All ACs</option>
          {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-700">{overdueTasks.length}</p>
          <p className="text-xs text-gray-500 mt-1">Overdue tasks</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-800">{pendingTasks.length}</p>
          <p className="text-xs text-gray-500 mt-1">Pending tasks</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalExpenses)}</p>
          <p className="text-xs text-gray-500 mt-1">Total recorded expenses</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['tasks', 'services', 'expenses'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t ? 'border-accent-600 text-accent-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'tasks' && overdueTasks.length > 0 && (
              <span className="ml-2 badge-red">{overdueTasks.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tasks tab */}
      {tab === 'tasks' && (
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="card"><EmptyState text="No maintenance tasks yet." /></div>
          ) : (
            <>
              {overdueTasks.length > 0 && (
                <Section title={`Overdue (${overdueTasks.length})`} accent="red">
                  {overdueTasks.map(task => (
                    <TaskRow key={task.id} task={task} acName={getAcName(task.acId)}
                      onComplete={() => handleComplete(task.id)}
                      onEdit={() => navigate(`/maintenance/task/${task.id}/edit`)}
                      onDelete={() => { setConfirmId(task.id); setConfirmType('task'); }} />
                  ))}
                </Section>
              )}
              {pendingTasks.length > 0 && (
                <Section title={`Upcoming / Pending (${pendingTasks.length})`} accent="blue">
                  {pendingTasks.map(task => (
                    <TaskRow key={task.id} task={task} acName={getAcName(task.acId)}
                      onComplete={() => handleComplete(task.id)}
                      onEdit={() => navigate(`/maintenance/task/${task.id}/edit`)}
                      onDelete={() => { setConfirmId(task.id); setConfirmType('task'); }} />
                  ))}
                </Section>
              )}
              {completedTasks.length > 0 && (
                <Section title={`Completed (${completedTasks.length})`} accent="gray">
                  {completedTasks.map(task => (
                    <TaskRow key={task.id} task={task} acName={getAcName(task.acId)}
                      onDelete={() => { setConfirmId(task.id); setConfirmType('task'); }} />
                  ))}
                </Section>
              )}
            </>
          )}
        </div>
      )}

      {/* Services tab */}
      {tab === 'services' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">{filteredServices.length} service record(s)</span>
            <span className="font-medium">Total: {formatCurrency(totalServices)}</span>
          </div>
          {filteredServices.length === 0 ? (
            <div className="card"><EmptyState text="No service records yet." /></div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                    <th className="pb-2 font-medium">AC</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Service Type</th>
                    <th className="pb-2 font-medium">Technician</th>
                    <th className="pb-2 font-medium text-right">Labour</th>
                    <th className="pb-2 font-medium text-right">Parts</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map(svc => (
                    <tr key={svc.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 text-gray-700">{getAcName(svc.acId)}</td>
                      <td className="py-2 text-gray-600 whitespace-nowrap">{formatDate(svc.serviceDate)}</td>
                      <td className="py-2 text-gray-800">{svc.serviceType}</td>
                      <td className="py-2 text-gray-500">{svc.technicianName || '—'}</td>
                      <td className="py-2 text-right">{formatCurrency(svc.labourCost)}</td>
                      <td className="py-2 text-right">{formatCurrency(svc.partsCost)}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(svc.labourCost + svc.partsCost + svc.otherCost)}</td>
                      <td className="py-2">
                        <button
                          onClick={() => { setConfirmId(svc.id); setConfirmType('service'); }}
                          className="text-gray-300 hover:text-red-500 text-xs"
                        >✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Expenses tab */}
      {tab === 'expenses' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">{filteredExpenses.length} expense(s)</span>
            <span className="font-medium">Total: {formatCurrency(totalExpenses)}</span>
          </div>

          {/* Per-AC summary */}
          {filterAc === 'all' && units.length > 0 && (
            <div className="card">
              <h3 className="text-xs font-semibold text-gray-500 mb-3">Per-AC Summary</h3>
              <div className="space-y-1">
                {units.map(unit => {
                  const total = expenses.filter(e => e.acId === unit.id).reduce((s, e) => s + e.amount, 0);
                  return (
                    <div key={unit.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{unit.name}</span>
                      <span className="font-medium">{formatCurrency(total)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredExpenses.length === 0 ? (
            <div className="card"><EmptyState text="No expense records yet." /></div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                    <th className="pb-2 font-medium">AC</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(exp => (
                    <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 text-gray-700">{getAcName(exp.acId)}</td>
                      <td className="py-2 text-gray-600 whitespace-nowrap">{formatDate(exp.date)}</td>
                      <td className="py-2">
                        <span className={`badge ${
                          exp.category === 'purchase' ? 'badge-blue' :
                          exp.category === 'installation' ? 'badge-gray' :
                          exp.category === 'repair' ? 'badge-red' :
                          'badge-yellow'
                        }`}>{exp.category}</span>
                      </td>
                      <td className="py-2 text-gray-800">{exp.description}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(exp.amount)}</td>
                      <td className="py-2">
                        <button
                          onClick={() => { setConfirmId(exp.id); setConfirmType('expense'); }}
                          className="text-gray-300 hover:text-red-500 text-xs"
                        >✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200">
                    <td colSpan={4} className="pt-2 text-sm font-medium text-gray-700">Total</td>
                    <td className="pt-2 text-right font-bold text-gray-800">{formatCurrency(totalExpenses)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmId}
        message="Delete this record? This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={doDelete}
        onCancel={() => setConfirmId(null)}
      />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function Section({ title, children, accent }: {
  title: string;
  children: React.ReactNode;
  accent: 'red' | 'blue' | 'gray';
}) {
  const colors = {
    red: 'text-red-700 border-red-200 bg-red-50',
    blue: 'text-accent-700 border-accent-100 bg-accent-50',
    gray: 'text-gray-600 border-gray-100 bg-gray-50',
  };
  return (
    <div className={`border rounded-lg p-4 ${colors[accent]}`}>
      <h3 className="text-xs font-semibold mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function TaskRow({ task, acName, onComplete, onEdit, onDelete }: {
  task: import('../types').MaintenanceTask;
  acName: string;
  onComplete?: () => void;
  onEdit?: () => void;
  onDelete: () => void;
}) {
  const isCompleted = task.status === 'completed';
  const isOverdue = task.status === 'overdue';
  const t = today();
  const diff = Math.ceil((new Date(task.dueDate + 'T00:00:00').getTime() - new Date(t + 'T00:00:00').getTime()) / 86400000);

  return (
    <div className={`flex items-center justify-between bg-white border rounded px-3 py-2 gap-3 ${isCompleted ? 'opacity-60' : ''}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
        <p className="text-xs text-gray-500">
          {acName} · Due {formatDate(task.dueDate)}
          {task.recurrence && ` · Recurs every ${task.recurrence.interval} ${task.recurrence.unit}`}
          {task.description && ` · ${task.description}`}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isOverdue && <span className="badge-red">{Math.abs(diff)}d overdue</span>}
        {!isOverdue && !isCompleted && diff <= 7 && <span className="badge-yellow">Due soon</span>}
        {isCompleted && <span className="badge-gray">Done {formatDate(task.completedDate)}</span>}
        {!isCompleted && onComplete && (
          <button onClick={onComplete} className="btn-secondary btn-sm">Complete</button>
        )}
        {onEdit && !isCompleted && (
          <button onClick={onEdit} className="btn-secondary btn-sm">Edit</button>
        )}
        <button onClick={onDelete} className="text-gray-300 hover:text-red-500 text-xs">✕</button>
      </div>
    </div>
  );
}
