import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsAPI } from '../api';
import { PageSpinner, Badge, Modal, EmptyState, ConfirmDialog } from '../components/common/UI';
import { FolderKanban, Plus, Trash2, Users, CheckSquare, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ProjectForm = ({ onSubmit, loading }) => {
  const [form, setForm] = useState({ name: '', description: '', dueDate: '' });
  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Project name is required.'); return; }
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
        <input name="name" value={form.name} onChange={handle} className="input" placeholder="e.g. Website Redesign" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea name="description" value={form.description} onChange={handle} className="input resize-none" rows={3} placeholder="What is this project about?" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
        <input type="date" name="dueDate" value={form.dueDate} onChange={handle} className="input" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </form>
  );
};

export default function Projects() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: projectsAPI.create,
    onSuccess: () => {
      qc.invalidateQueries(['projects']);
      setShowCreate(false);
      toast.success('Project created!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create project.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => projectsAPI.remove(id),
    onSuccess: () => {
      qc.invalidateQueries(['projects']);
      setDeleteTarget(null);
      toast.success('Project deleted.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete.'),
  });

  if (isLoading) return <PageSpinner />;

  const projects = data || [];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Grid */}
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project and start assigning tasks to your team."
          action={
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Create Project
            </button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const total = Object.values(p.taskCounts || {}).reduce((a, b) => a + b, 0);
            const done  = p.taskCounts?.completed || 0;
            const pct   = total ? Math.round((done / total) * 100) : 0;
            const isAdmin = p.members.some(
              (m) => m.user?._id === user._id && m.role === 'admin'
            );

            return (
              <div key={p._id} className="card hover:shadow-md transition-shadow group flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{p.description || 'No description'}</p>
                  </div>
                  <Badge type="status" value={p.status} />
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{done}/{total} tasks</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-primary-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {p.members.length} members
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckSquare size={12} /> {p.taskCounts?.['in-progress'] || 0} in progress
                  </span>
                </div>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                  <Link
                    to={`/projects/${p._id}`}
                    className="text-sm text-primary-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    Open <ArrowRight size={14} />
                  </Link>
                  {isAdmin && (
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <ProjectForm onSubmit={(data) => createMutation.mutate(data)} loading={createMutation.isPending} />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        loading={deleteMutation.isPending}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All tasks will be permanently deleted.`}
      />
    </div>
  );
}
