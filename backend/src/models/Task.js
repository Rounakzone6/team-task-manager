const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'completed'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedTo: 1 });

// ── Hooks ─────────────────────────────────────────────────────────────────────

// Track when task is completed
taskSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'completed') {
      this.completedAt = new Date();
    } else {
      this.completedAt = null;
    }
  }
  next();
});

// ── Virtuals ──────────────────────────────────────────────────────────────────
taskSchema.virtual('isOverdue').get(function () {
  return (
    this.dueDate &&
    this.status !== 'completed' &&
    new Date() > new Date(this.dueDate)
  );
});

module.exports = mongoose.model('Task', taskSchema);
