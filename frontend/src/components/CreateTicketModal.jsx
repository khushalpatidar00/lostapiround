import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createTicket } from '../api';

const initialForm = {
  subject: '',
  description: '',
  customerEmail: '',
  priority: 'medium',
};

const CreateTicketModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const errs = {};
    if (!form.subject.trim()) errs.subject = 'Subject is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.customerEmail.trim()) {
      errs.customerEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) {
      errs.customerEmail = 'Please enter a valid email address';
    }
    if (!form.priority) errs.priority = 'Priority is required';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setServerError('');
    try {
      const res = await createTicket(form);
      onCreated(res.data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create ticket. Please try again.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>New Support Ticket</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={24} />
          </button>
        </div>

        {serverError && (
          <div className="alert alert-error">{serverError}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input
              id="subject"
              name="subject"
              type="text"
              placeholder="Brief summary of the issue"
              value={form.subject}
              onChange={handleChange}
              style={{ width: '100%' }}
            />
            {errors.subject && <span className="form-error">{errors.subject}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              placeholder="Describe the issue in detail..."
              value={form.description}
              onChange={handleChange}
              style={{ width: '100%' }}
            />
            {errors.description && <span className="form-error">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="customerEmail">Customer Email</label>
            <input
              id="customerEmail"
              name="customerEmail"
              type="email"
              placeholder="customer@example.com"
              value={form.customerEmail}
              onChange={handleChange}
              style={{ width: '100%' }}
            />
            {errors.customerEmail && <span className="form-error">{errors.customerEmail}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={form.priority}
              onChange={handleChange}
              style={{ width: '100%' }}
            >
              <option value="low">Low (72h SLA)</option>
              <option value="medium">Medium (24h SLA)</option>
              <option value="high">High (4h SLA)</option>
              <option value="urgent">Urgent (1h SLA)</option>
            </select>
            {errors.priority && <span className="form-error">{errors.priority}</span>}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;
