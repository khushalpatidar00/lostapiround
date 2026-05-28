import React from 'react';
import { Clock, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';

const TicketCard = ({ ticket, onMove, isValidTransition }) => {
  const { _id, subject, priority, ageMinutes, slaBreached, status } = ticket;

  // Format age nicely (e.g. "3h 12m")
  const formatAge = (mins) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('ticketId', _id);
    e.dataTransfer.setData('sourceStatus', status);
    // Add dragging class after a small delay to keep the card visible while dragging
    setTimeout(() => {
      e.target.classList.add('dragging');
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
  };

  // Determine which moves are valid for UI buttons
  const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
  const currentIndex = STATUSES.indexOf(status);
  
  const canMoveForward = currentIndex < STATUSES.length - 1 && isValidTransition(status, STATUSES[currentIndex + 1]);
  const canMoveBackward = currentIndex > 0 && isValidTransition(status, STATUSES[currentIndex - 1]);

  return (
    <div 
      className={`ticket-card ${slaBreached ? 'breached' : ''}`}
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="ticket-header">
        <span className={`badge badge-${priority}`}>{priority}</span>
        {slaBreached && (
          <span className="breach-indicator" title="SLA Breached">
            <AlertTriangle size={16} />
          </span>
        )}
      </div>
      
      <h3 className="ticket-subject">{subject}</h3>
      
      <div className="ticket-meta">
        <Clock size={14} />
        <span>Age: {formatAge(ageMinutes)}</span>
      </div>

      <div className="ticket-actions">
        <button 
          className="action-btn" 
          onClick={() => onMove(_id, status, STATUSES[currentIndex - 1])}
          disabled={!canMoveBackward}
          title="Move back"
        >
          <ArrowLeft size={16} />
        </button>
        <button 
          className="action-btn" 
          onClick={() => onMove(_id, status, STATUSES[currentIndex + 1])}
          disabled={!canMoveForward}
          title="Move forward"
        >
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default TicketCard;
