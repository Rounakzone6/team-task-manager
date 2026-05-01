import { X } from 'lucide-react';

// ── Modal ─────────────────────────────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
};

// ── Badge ─────────────────────────────────────────────────────────────────────
const statusStyles = {
  todo:        'bg-gray-100 text-gray-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  completed:   'bg-green-100 text-green-700',
  active:      'bg-emerald-100 text-emerald-700',
  archived:    'bg-gray-100 text-gray-500',
};

const priorityStyles = {
  low:    'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high:   'bg-red-100 text-red-700',
};

const roleStyles = {
  admin:  'bg-purple-100 text-purple-700',
  member: 'bg-blue-50 text-blue-600',
};

export const Badge = ({ type = 'status', value }) => {
  const map = type === 'priority' ? priorityStyles : type === 'role' ? roleStyles : statusStyles;
  const cls = map[value] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`badge ${cls}`}>
      {value?.replace('-', ' ')}
    </span>
  );
};

// ── Spinner ───────────────────────────────────────────────────────────────────
export const Spinner = ({ className = 'h-8 w-8' }) => (
  <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${className}`} />
);

export const PageSpinner = () => (
  <div className="flex items-center justify-center min-h-[300px]">
    <Spinner className="h-10 w-10" />
  </div>
);

// ── EmptyState ────────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center min-h-[300px] text-center px-6">
    {Icon && (
      <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={32} className="text-primary-400" />
      </div>
    )}
    <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 mb-6 max-w-xs">{description}</p>}
    {action}
  </div>
);

// ── ConfirmDialog ─────────────────────────────────────────────────────────────
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, loading }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title}>
    <p className="text-sm text-gray-600 mb-6">{message}</p>
    <div className="flex justify-end gap-3">
      <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
      <button
        onClick={onConfirm}
        disabled={loading}
        className="btn-danger text-sm"
      >
        {loading ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  </Modal>
);
