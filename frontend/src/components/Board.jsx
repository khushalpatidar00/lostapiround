import React from 'react';
import Column from './Column';

const Board = ({ tickets, onMoveTicket }) => {
  // Allowed status transitions logic (same as backend)
  const VALID_TRANSITIONS = {
    open: ['in_progress'],
    in_progress: ['resolved', 'open'],
    resolved: ['closed', 'in_progress'],
    closed: [],
  };

  const isValidTransition = (from, to) => {
    return VALID_TRANSITIONS[from]?.includes(to);
  };

  const handleMove = (ticketId, sourceStatus, targetStatus) => {
    if (isValidTransition(sourceStatus, targetStatus)) {
      onMoveTicket(ticketId, targetStatus);
    } else {
      // In a real app, you might show a toast notification here
      console.warn(`Invalid transition: ${sourceStatus} -> ${targetStatus}`);
    }
  };

  const getTicketsByStatus = (status) => {
    return tickets.filter(t => t.status === status);
  };

  return (
    <div className="board">
      <Column 
        title="Open" 
        status="open" 
        tickets={getTicketsByStatus('open')} 
        onMove={handleMove}
        isValidTransition={isValidTransition}
      />
      <Column 
        title="In Progress" 
        status="in_progress" 
        tickets={getTicketsByStatus('in_progress')} 
        onMove={handleMove}
        isValidTransition={isValidTransition}
      />
      <Column 
        title="Resolved" 
        status="resolved" 
        tickets={getTicketsByStatus('resolved')} 
        onMove={handleMove}
        isValidTransition={isValidTransition}
      />
      <Column 
        title="Closed" 
        status="closed" 
        tickets={getTicketsByStatus('closed')} 
        onMove={handleMove}
        isValidTransition={isValidTransition}
      />
    </div>
  );
};

export default Board;
