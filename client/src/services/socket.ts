import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// Debug events
socket.on('connect', () => {
  console.log('Socket connected with ID:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
});

socket.onAny((event, ...args) => {
  console.log('Socket event:', event, args);
});

export default socket; 