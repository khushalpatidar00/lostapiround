import React from 'react';
import { AlertTriangle } from 'lucide-react';

const StatsStrip = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="glass-panel stats-strip">
        <span style={{ color: 'var(--text-muted)' }}>Loading stats...</span>
      </div>
    );
  }

  if (!stats) return null;

  const { byStatus = {}, byPriority = {}, breachedOpen = 0 } = stats;
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

  return (
    <div className="glass-panel stats-strip">
      <div className="stat-item">
        <span className="stat-label">Total Tickets</span>
        <span className="stat-value">{total}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Open</span>
        <span className="stat-value">{byStatus.open || 0}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">In Progress</span>
        <span className="stat-value">{byStatus.in_progress || 0}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Resolved</span>
        <span className="stat-value">{byStatus.resolved || 0}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Closed</span>
        <span className="stat-value">{byStatus.closed || 0}</span>
      </div>

      <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 0.5rem' }} />

      <div className="stat-item">
        <span className="stat-label">Urgent</span>
        <span className="stat-value" style={{ color: 'var(--priority-urgent)' }}>{byPriority.urgent || 0}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">High</span>
        <span className="stat-value" style={{ color: 'var(--priority-high)' }}>{byPriority.high || 0}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Medium</span>
        <span className="stat-value" style={{ color: 'var(--priority-medium)' }}>{byPriority.medium || 0}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Low</span>
        <span className="stat-value" style={{ color: 'var(--priority-low)' }}>{byPriority.low || 0}</span>
      </div>

      <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 0.5rem' }} />

      <div className="stat-item">
        <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <AlertTriangle size={13} /> SLA Breached
        </span>
        <span className={`stat-value ${breachedOpen > 0 ? 'danger' : ''}`}>{breachedOpen}</span>
      </div>
    </div>
  );
};

export default StatsStrip;
