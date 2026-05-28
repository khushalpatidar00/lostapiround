import React, { useState } from 'react';
import TicketCard from './TicketCard';

const Column = ({ title, status, tickets, onMove, isValidTransition }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const ticketId = e.dataTransfer.getData('ticketId');
    const sourceStatus = e.dataTransfer.getData('sourceStatus');
    
    // Only attempt move if it's dropped in a different column
    if (sourceStatus && sourceStatus !== status) {
      onMove(ticketId, sourceStatus, status);
    }
  };

  return (
    <div 
      className={`column ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="column-header">
        <h2 className="column-title">{title}</h2>
        <span className="column-count">{tickets.length}</span>
      </div>
      
      <div className="ticket-list">
        {tickets.map(ticket => (
          <TicketCard 
            key={ticket._id} 
            ticket={ticket} 
            onMove={onMove}
            isValidTransition={isValidTransition}
          />
        ))}
      </div>
    </div>
  );
};

export default Column;
