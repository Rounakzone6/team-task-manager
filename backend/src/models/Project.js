const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [memberSchema],
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
    },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ owner: 1 });

// ── Hooks ─────────────────────────────────────────────────────────────────────

// Ensure owner is always in the members list as admin
projectSchema.pre('save', function (next) {
  const ownerInMembers = this.members.some(
    (m) => m.user.toString() === this.owner.toString()
  );
  if (!ownerInMembers) {
    this.members.unshift({ user: this.owner, role: 'admin' });
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
