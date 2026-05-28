const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please provide a valid email address',
      },
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: {
        values: ['low', 'medium', 'high', 'urgent'],
        message: 'Priority must be one of: low, medium, high, urgent',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['open', 'in_progress', 'resolved', 'closed'],
        message: 'Status must be one of: open, in_progress, resolved, closed',
      },
      default: 'open',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Response time targets in minutes based on priority
const SLA_TARGETS = {
  urgent: 60,       // 1 hour
  high: 240,        // 4 hours
  medium: 1440,     // 24 hours
  low: 4320,        // 72 hours
};

// Compute ageMinutes - time between createdAt and now (or resolvedAt if resolved/closed)
ticketSchema.methods.computeDerivedFields = function () {
  const now = new Date();
  let endTime;

  if (this.resolvedAt) {
    endTime = this.resolvedAt;
  } else {
    endTime = now;
  }

  const ageMs = endTime.getTime() - this.createdAt.getTime();
  const ageMinutes = Math.floor(ageMs / 60000);

  // SLA breached if age exceeds the target for its priority
  const target = SLA_TARGETS[this.priority];
  const slaBreached = ageMinutes > target;

  return { ageMinutes, slaBreached };
};

// Allowed status transitions
const VALID_TRANSITIONS = {
  open: ['in_progress'],
  in_progress: ['resolved', 'open'],
  resolved: ['closed', 'in_progress'],
  closed: [],
};

ticketSchema.statics.VALID_TRANSITIONS = VALID_TRANSITIONS;
ticketSchema.statics.SLA_TARGETS = SLA_TARGETS;

module.exports = mongoose.model('Ticket', ticketSchema);
