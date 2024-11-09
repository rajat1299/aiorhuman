import { io, Socket } from 'socket.io-client';
import { getToken } from './authService';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

export const initSocket = (token: string) => {
  const socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket']
  });
  return socket;
};

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    try {
      const token = getToken();
      if (!token) {
        console.error('No auth token found');
        return;
      }

      this.socket = initSocket(token);

      this.setupEventListeners();
      return this.socket;
    } catch (error) {
      console.error('Socket connection error:', error);
      return null;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try reconnecting
        this.handleReconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      setTimeout(() => {
        this.connect();
      }, 1000 * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export default new SocketService(); 