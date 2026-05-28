import axios from 'axios';

// Ensure the deployed frontend can talk to the deployed backend.
// In development, it defaults to the local port 5000.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getTickets = (params) => api.get('/tickets', { params });
export const getStats = () => api.get('/tickets/stats');
export const createTicket = (data) => api.post('/tickets', data);
export const updateTicketStatus = (id, status) => api.patch(`/tickets/${id}`, { status });

export default api;
