import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { projectsAPI, tasksAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { PageSpinner, Badge } from '../components/common/UI';
import { FolderKanban, CheckSquare, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();

  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll().then((r) => r.data.data),
  });

  const { data: tasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksAPI.getAll().then((r) => r.data.data),
  });

  if (loadingProjects || loadingTasks) return <PageSpinner />;

  const projects = projectsData || [];
  const tasks    = tasksData    || [];

  const myTasks    = tasks.filter((t) => t.assignedTo?._id === user._id);
  const overdue    = myTasks.filter((t) => t.isOverdue);
  const inProgress = myTasks.filter((t) => t.status === 'in-progress');
  const completed  = myTasks.filter((t) => t.status === 'completed');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Total Projects"  value={projects.length}  color="bg-primary-600" />
        <StatCard icon={CheckSquare} label="In Progress"     value={inProgress.length} color="bg-blue-500" />
        <StatCard icon={Clock}       label="Completed Tasks" value={completed.length}  color="bg-green-500" />
        <StatCard icon={AlertTriangle} label="Overdue Tasks" value={overdue.length}    color="bg-red-500" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Projects</h2>
            <Link to="/projects" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {projects.slice(0, 5).map((p) => (
              <Link
                key={p._id}
                to={`/projects/${p._id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 group-hover:text-primary-600">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {p.members.length} member{p.members.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{p.taskCounts?.completed ?? 0}/{Object.values(p.taskCounts || {}).reduce((a, b) => a + b, 0)} done</span>
                  <Badge type="status" value={p.status} />
                </div>
              </Link>
            ))}
            {projects.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No projects yet.</p>
            )}
          </div>
        </div>

        {/* Overdue / Upcoming Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">My Tasks</h2>
            <Link to="/my-tasks" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {myTasks.slice(0, 5).map((t) => (
              <div key={t._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div className="flex-1 min-w-0 mr-3">
                  <p className={`text-sm font-medium truncate ${t.isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                    {t.isOverdue && '⚠ '}{t.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{t.project?.name}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge type="priority" value={t.priority} />
                  <Badge type="status" value={t.status} />
                </div>
              </div>
            ))}
            {myTasks.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No tasks assigned to you.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
