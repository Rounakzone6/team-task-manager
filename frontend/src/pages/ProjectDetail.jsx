import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsAPI, tasksAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { PageSpinner, Badge, Modal, EmptyState, ConfirmDialog } from '../components/common/UI';
import {
  Plus, Trash2, UserPlus, UserMinus, ChevronLeft,
  CheckSquare, Clock, AlertTriangle, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

// ── Task Card ─────────────────────────────────────────────────────────────────
const TaskCard = ({ task, isAdmin, onDelete, onStatusChange }) => {
  const statuses = ['todo', 'in-progress', 'completed'];

  return (
    <div className={`card p-4 flex flex-col gap-3 ${task.isOverdue ? 'border-red-200' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm font-medium ${task.isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
          {task.isOverdue && '⚠ '}{task.title}
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge type="priority" value={task.priority} />
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.assignedTo ? (
            <div className="flex items-center gap-1.5">
              <img src={task.assignedTo.avatar} alt="" className="w-5 h-5 rounded-full" />
              <span className="text-xs text-gray-500">{task.assignedTo.name}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">Unassigned</span>
          )}
          {task.dueDate && (
            <span className={`text-xs ${task.isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
              · Due {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
        </div>

        <select
          value={task.status}
          onChange={(e) => onStatusChange(task._id, e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>{s.replace('-', ' ')}</option>
          ))}
        </select>
      </div>

      {isAdmin && (
        <div className="flex justify-end pt-1 border-t border-gray-100">
          <button
            onClick={() => onDelete(task)}
            className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

// ── Task Create Form ──────────────────────────────────────────────────────────
const TaskForm = ({ projectId, members, onSubmit, loading }) => {
  const [form, setForm] = useState({
    title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '',
  });
  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    onSubmit({ ...form, projectId, assignedTo: form.assignedTo || undefined });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input name="title" value={form.title} onChange={handle} className="input" placeholder="Task title" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea name="description" value={form.description} onChange={handle} className="input resize-none" rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
          <select name="assignedTo" value={form.assignedTo} onChange={handle} className="input">
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select name="priority" value={form.priority} onChange={handle} className="input">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
        <input type="date" name="dueDate" value={form.dueDate} onChange={handle} className="input" />
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Creating...' : 'Create Task'}
        </button>
      </div>
    </form>
  );
};

// ── Add Member Form ───────────────────────────────────────────────────────────
const AddMemberForm = ({ onSubmit, loading }) => {
  const [query, setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [role, setRole]     = useState('member');
  const [searching, setSearching] = useState(false);

  const search = async (q) => {
    setQuery(q);
    setSelected(null);
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const { data } = await usersAPI.search(q);
      setResults(data.data);
    } catch { setResults([]); }
    finally { setSearching(false); }
  };

  const submit = (e) => {
    e.preventDefault();
    if (!selected) { toast.error('Select a user first.'); return; }
    onSubmit({ userId: selected._id, role });
    setQuery(''); setResults([]); setSelected(null);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Search User</label>
        <input
          value={query}
          onChange={(e) => search(e.target.value)}
          className="input"
          placeholder="Type name or email…"
        />
        {results.length > 0 && !selected && (
          <div className="border border-gray-200 rounded-lg mt-1 divide-y divide-gray-100 max-h-48 overflow-y-auto">
            {results.map((u) => (
              <button
                key={u._id}
                type="button"
                onClick={() => { setSelected(u); setQuery(u.name); setResults([]); }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left"
              >
                <img src={u.avatar} alt="" className="w-7 h-7 rounded-full" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="input">
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading || !selected} className="btn-primary">
          {loading ? 'Adding...' : 'Add Member'}
        </button>
      </div>
    </form>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [showTask, setShowTask]     = useState(false);
  const [showMember, setShowMember] = useState(false);
  const [deleteTask, setDeleteTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: projectData, isLoading: loadingProject } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsAPI.getById(id).then((r) => r.data.data),
  });

  const { data: tasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks', { project: id }],
    queryFn: () => tasksAPI.getAll({ project: id }).then((r) => r.data.data),
  });

  const createTaskMutation = useMutation({
    mutationFn: tasksAPI.create,
    onSuccess: () => { qc.invalidateQueries(['tasks', { project: id }]); qc.invalidateQueries(['projects']); setShowTask(false); toast.success('Task created!'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => tasksAPI.remove(taskId),
    onSuccess: () => { qc.invalidateQueries(['tasks', { project: id }]); qc.invalidateQueries(['projects']); setDeleteTask(null); toast.success('Task deleted.'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ taskId, status }) => tasksAPI.updateStatus(taskId, status),
    onSuccess: () => { qc.invalidateQueries(['tasks', { project: id }]); qc.invalidateQueries(['projects']); toast.success('Status updated.'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Cannot update status.'),
  });

  const addMemberMutation = useMutation({
    mutationFn: (data) => projectsAPI.addMember(id, data),
    onSuccess: () => { qc.invalidateQueries(['project', id]); setShowMember(false); toast.success('Member added!'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => projectsAPI.removeMember(id, userId),
    onSuccess: () => { qc.invalidateQueries(['project', id]); toast.success('Member removed.'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  if (loadingProject || loadingTasks) return <PageSpinner />;

  const project = projectData;
  const tasks   = tasksData || [];

  const myMember = project?.members?.find((m) => m.user?._id === user._id);
  const isAdmin  = myMember?.role === 'admin';

  const filtered = statusFilter ? tasks.filter((t) => t.status === statusFilter) : tasks;

  const cols = {
    todo:        filtered.filter((t) => t.status === 'todo'),
    'in-progress': filtered.filter((t) => t.status === 'in-progress'),
    completed:   filtered.filter((t) => t.status === 'completed'),
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-2"
          >
            <ChevronLeft size={16} /> Projects
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1>
          {project?.description && (
            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
          )}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowMember(true)} className="btn-secondary flex items-center gap-2 text-sm">
              <UserPlus size={15} /> Add Member
            </button>
            <button onClick={() => setShowTask(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={15} /> Add Task
            </button>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="card py-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <Users size={15} /> Team ({project?.members?.length})
          </span>
          {project?.members?.map((m) => (
            <div key={m.user?._id} className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <img src={m.user?.avatar} alt="" className="w-5 h-5 rounded-full" />
              <span className="text-xs text-gray-700">{m.user?.name}</span>
              <Badge type="role" value={m.role} />
              {isAdmin && m.user?._id !== project?.owner?._id && m.user?._id !== user._id && (
                <button
                  onClick={() => removeMemberMutation.mutate(m.user?._id)}
                  className="text-gray-300 hover:text-red-500 ml-1 transition-colors"
                  title="Remove member"
                >
                  <UserMinus size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Kanban */}
      <div className="grid lg:grid-cols-3 gap-4">
        {[
          { key: 'todo',        label: 'To Do',       icon: Clock,          color: 'text-gray-500' },
          { key: 'in-progress', label: 'In Progress',  icon: AlertTriangle,  color: 'text-blue-500' },
          { key: 'completed',   label: 'Completed',    icon: CheckSquare,    color: 'text-green-500' },
        ].map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="bg-gray-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={15} className={color} />
              <span className="text-sm font-semibold text-gray-700">{label}</span>
              <span className="ml-auto text-xs bg-white text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">
                {cols[key].length}
              </span>
            </div>

            {cols[key].map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                isAdmin={isAdmin}
                onDelete={setDeleteTask}
                onStatusChange={(taskId, status) =>
                  statusMutation.mutate({ taskId, status })
                }
              />
            ))}

            {cols[key].length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">No tasks here.</p>
            )}
          </div>
        ))}
      </div>

      {/* Modals */}
      <Modal isOpen={showTask} onClose={() => setShowTask(false)} title="Create Task">
        <TaskForm
          projectId={id}
          members={project?.members || []}
          onSubmit={(data) => createTaskMutation.mutate(data)}
          loading={createTaskMutation.isPending}
        />
      </Modal>

      <Modal isOpen={showMember} onClose={() => setShowMember(false)} title="Add Team Member">
        <AddMemberForm
          onSubmit={(data) => addMemberMutation.mutate(data)}
          loading={addMemberMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTask}
        onClose={() => setDeleteTask(null)}
        onConfirm={() => deleteTaskMutation.mutate(deleteTask._id)}
        loading={deleteTaskMutation.isPending}
        title="Delete Task"
        message={`Delete "${deleteTask?.title}"? This action cannot be undone.`}
      />
    </div>
  );
}
