import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import Board from './components/Board';
import StatsStrip from './components/StatsStrip';
import CreateTicketModal from './components/CreateTicketModal';
import { getTickets, getStats, updateTicketStatus } from './api';
import './index.css';

const App = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [moveError, setMoveError] = useState('');

  // Filters
  const [filterPriority, setFilterPriority] = useState('');
  const [filterBreached, setFilterBreached] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterPriority) params.priority = filterPriority;
      if (filterBreached) params.breached = 'true';
      const res = await getTickets(params);
      setTickets(res.data);
    } catch (err) {
      setError('Failed to load tickets. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [filterPriority, filterBreached]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh stats every 60 seconds so ageMinutes stays current
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTickets();
      fetchStats();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchTickets, fetchStats]);

  const handleTicketCreated = (newTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
    fetchStats();
  };

  const handleMoveTicket = async (ticketId, newStatus) => {
    setMoveError('');
    // Optimistically update the UI
    const previousTickets = [...tickets];
    setTickets((prev) =>
      prev.map((t) =>
        t._id === ticketId ? { ...t, status: newStatus } : t
      )
    );

    try {
      const res = await updateTicketStatus(ticketId, newStatus);
      // Replace with server response (has updated derived fields)
      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? res.data : t))
      );
      fetchStats();
    } catch (err) {
      // Rollback on error
      setTickets(previousTickets);
      const msg = err.response?.data?.error || 'Failed to move ticket.';
      setMoveError(msg);
      // Clear error after 4 seconds
      setTimeout(() => setMoveError(''), 4000);
    }
  };

  return (
    <>
      <div className="app-container">
        {/* Header */}
        <div className="header">
          <div>
            <h1>🎫 DeskFlow</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
              Support Ticket Triage Board
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => { fetchTickets(); fetchStats(); }}
              title="Refresh"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button className="btn" onClick={() => setShowModal(true)}>
              <Plus size={16} />
              New Ticket
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <StatsStrip stats={stats} loading={statsLoading} />

        {/* Controls / Filters */}
        <div className="glass-panel" style={{ padding: '1rem 1.5rem' }}>
          <div className="controls-bar">
            <div className="filters">
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
                Filter by:
              </label>
              <select
                id="filter-priority"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                title="Filter by priority"
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <label className="checkbox-label" htmlFor="filter-breached">
                <input
                  id="filter-breached"
                  type="checkbox"
                  checked={filterBreached}
                  onChange={(e) => setFilterBreached(e.target.checked)}
                  style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                />
                SLA Breached Only
              </label>
            </div>

            {(filterPriority || filterBreached) && (
              <button
                className="btn btn-secondary"
                onClick={() => { setFilterPriority(''); setFilterBreached(false); }}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Move Error Alert */}
        {moveError && (
          <div className="alert alert-error">
            ⚠️ {moveError}
          </div>
        )}

        {/* Loading / Error / Board */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem' }}>
            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
            <p>Loading tickets...</p>
          </div>
        ) : error ? (
          <div className="alert alert-error" style={{ textAlign: 'center' }}>
            {error}
          </div>
        ) : (
          <Board tickets={tickets} onMoveTicket={handleMoveTicket} />
        )}
      </div>

      {/* Create Ticket Modal */}
      {showModal && (
        <CreateTicketModal
          onClose={() => setShowModal(false)}
          onCreated={handleTicketCreated}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default App;
