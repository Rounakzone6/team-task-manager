import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { PageSpinner, Badge, EmptyState } from '../components/common/UI';
import { CheckSquare, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function MyTasks() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter]     = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', { assignedTo: user._id }],
    queryFn: () => tasksAPI.getAll({ assignedTo: user._id }).then((r) => r.data.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => tasksAPI.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries(['tasks']);
      toast.success('Status updated.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Cannot update.'),
  });

  if (isLoading) return <PageSpinner />;

  const tasks = (data || []).filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tasks assigned to you across all projects</p>
        </div>
        <span className="text-sm text-gray-500">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={15} className="text-gray-400" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-400"
        >
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-400"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        {(statusFilter || priorityFilter) && (
          <button
            onClick={() => { setStatusFilter(''); setPriorityFilter(''); }}
            className="text-xs text-primary-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Tasks */}
      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description="Tasks assigned to you will appear here."
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task._id}
              className={`card p-4 flex items-center gap-4 ${task.isOverdue ? 'border-red-200 bg-red-50/30' : ''}`}
            >
              {/* Status toggle */}
              <button
                onClick={() => {
                  const next = task.status === 'completed' ? 'todo'
                    : task.status === 'todo' ? 'in-progress' : 'completed';
                  statusMutation.mutate({ id: task._id, status: next });
                }}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                  ${task.status === 'completed'
                    ? 'bg-green-500 border-green-500 text-white'
                    : task.status === 'in-progress'
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-primary-400'
                  }`}
                title="Click to cycle status"
              >
                {task.status === 'completed' && (
                  <svg viewBox="0 0 12 12" className="w-3 h-3 fill-current">
                    <path d="M1 6l4 4L11 2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : task.isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
                  {task.isOverdue && '⚠ '}{task.title}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-gray-400">{task.project?.name}</span>
                  {task.dueDate && (
                    <span className={`text-xs ${task.isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                      · Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge type="priority" value={task.priority} />
                <Badge type="status" value={task.status} />
              </div>

              {/* Quick status picker */}
              <select
                value={task.status}
                onChange={(e) => statusMutation.mutate({ id: task._id, status: e.target.value })}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400 hidden sm:block"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
