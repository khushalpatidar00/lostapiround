const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');

const router = express.Router();

// Helper to format ticket with derived fields
function formatTicket(ticket) {
  const obj = ticket.toObject();
  const { ageMinutes, slaBreached } = ticket.computeDerivedFields();
  obj.ageMinutes = ageMinutes;
  obj.slaBreached = slaBreached;
  // Remove mongoose internals
  delete obj.__v;
  delete obj.id;
  return obj;
}

// Helper to handle validation errors
function handleValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return res.status(400).json({ error: messages.join('. ') });
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────────────────
// GET /tickets/stats — aggregate counts
// Must be defined BEFORE /tickets/:id so Express doesn't treat "stats" as an id
// ──────────────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const tickets = await Ticket.find();

    const byStatus = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    const byPriority = { low: 0, medium: 0, high: 0, urgent: 0 };
    let breachedOpen = 0;

    tickets.forEach((t) => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;

      const { slaBreached } = t.computeDerivedFields();
      if (slaBreached && (t.status === 'open' || t.status === 'in_progress')) {
        breachedOpen++;
      }
    });

    res.json({ byStatus, byPriority, breachedOpen });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching stats' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /tickets — create a ticket
// ──────────────────────────────────────────────────────────────────────────────
router.post(
  '/',
  [
    body('subject').notEmpty().withMessage('Subject is required').trim(),
    body('description').notEmpty().withMessage('Description is required').trim(),
    body('customerEmail')
      .notEmpty()
      .withMessage('Customer email is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('priority')
      .notEmpty()
      .withMessage('Priority is required')
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Priority must be one of: low, medium, high, urgent'),
  ],
  async (req, res) => {
    const valError = handleValidationErrors(req, res);
    if (valError) return;

    try {
      const { subject, description, customerEmail, priority } = req.body;
      const ticket = await Ticket.create({
        subject,
        description,
        customerEmail,
        priority,
      });
      res.status(201).json(formatTicket(ticket));
    } catch (err) {
      if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ error: messages.join('. ') });
      }
      res.status(500).json({ error: 'Server error creating ticket' });
    }
  }
);

// ──────────────────────────────────────────────────────────────────────────────
// GET /tickets — list tickets with optional filters
// ──────────────────────────────────────────────────────────────────────────────
router.get(
  '/',
  [
    query('status')
      .optional()
      .isIn(['open', 'in_progress', 'resolved', 'closed'])
      .withMessage('Invalid status filter'),
    query('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority filter'),
    query('breached').optional().isIn(['true', 'false']).withMessage('breached must be true or false'),
  ],
  async (req, res) => {
    const valError = handleValidationErrors(req, res);
    if (valError) return;

    try {
      const filter = {};
      if (req.query.status) filter.status = req.query.status;
      if (req.query.priority) filter.priority = req.query.priority;

      let tickets = await Ticket.find(filter).sort({ createdAt: -1 });

      let results = tickets.map((t) => formatTicket(t));

      // Apply breached filter in-memory (since it's a computed field)
      if (req.query.breached === 'true') {
        results = results.filter((t) => t.slaBreached === true);
      }

      res.json(results);
    } catch (err) {
      res.status(500).json({ error: 'Server error fetching tickets' });
    }
  }
);

// ──────────────────────────────────────────────────────────────────────────────
// PATCH /tickets/:id — update a ticket (status transitions)
// ──────────────────────────────────────────────────────────────────────────────
router.patch(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid ticket ID'),
    body('status')
      .optional()
      .isIn(['open', 'in_progress', 'resolved', 'closed'])
      .withMessage('Status must be one of: open, in_progress, resolved, closed'),
    body('subject').optional().notEmpty().withMessage('Subject cannot be empty').trim(),
    body('description').optional().notEmpty().withMessage('Description cannot be empty').trim(),
    body('customerEmail')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Priority must be one of: low, medium, high, urgent'),
  ],
  async (req, res) => {
    const valError = handleValidationErrors(req, res);
    if (valError) return;

    try {
      const ticket = await Ticket.findById(req.params.id);
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      // Handle status transition
      if (req.body.status && req.body.status !== ticket.status) {
        const allowed = Ticket.VALID_TRANSITIONS[ticket.status];
        if (!allowed.includes(req.body.status)) {
          return res.status(400).json({
            error: `Invalid status transition: ${ticket.status} → ${req.body.status}. Allowed transitions from '${ticket.status}': ${allowed.length ? allowed.join(', ') : 'none'}`,
          });
        }

        ticket.status = req.body.status;

        // Set resolvedAt when moving to resolved
        if (req.body.status === 'resolved') {
          ticket.resolvedAt = new Date();
        }

        // Clear resolvedAt when moving back from resolved
        if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
          ticket.resolvedAt = null;
        }
      }

      // Update other editable fields
      if (req.body.subject !== undefined) ticket.subject = req.body.subject;
      if (req.body.description !== undefined) ticket.description = req.body.description;
      if (req.body.customerEmail !== undefined) ticket.customerEmail = req.body.customerEmail;
      if (req.body.priority !== undefined) ticket.priority = req.body.priority;

      await ticket.save();
      res.json(formatTicket(ticket));
    } catch (err) {
      if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ error: messages.join('. ') });
      }
      res.status(500).json({ error: 'Server error updating ticket' });
    }
  }
);

// ──────────────────────────────────────────────────────────────────────────────
// DELETE /tickets/:id — delete a ticket
// ──────────────────────────────────────────────────────────────────────────────
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid ticket ID')],
  async (req, res) => {
    const valError = handleValidationErrors(req, res);
    if (valError) return;

    try {
      const ticket = await Ticket.findByIdAndDelete(req.params.id);
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      res.json({ message: 'Ticket deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Server error deleting ticket' });
    }
  }
);

module.exports = router;
