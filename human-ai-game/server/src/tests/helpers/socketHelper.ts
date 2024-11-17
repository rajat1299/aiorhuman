import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { app } from '../../app';
import { generateToken } from '../../utils/userUtils';
import { AddressInfo } from 'net';

export const createTestServer = (): Promise<{
  server: Server;
  serverAddress: string;
  cleanup: () => Promise<void>;
}> => {
  return new Promise((resolve) => {
    const httpServer = createServer(app);
    const io = new Server(httpServer);
    
    httpServer.listen(() => {
      const { port } = httpServer.address() as AddressInfo;
      const serverAddress = `http://localhost:${port}`;
      
      const cleanup = async () => {
        return new Promise<void>((resolve) => {
          io.close(() => {
            httpServer.close(() => resolve());
          });
        });
      };

      resolve({ server: io, serverAddress, cleanup });
    });
  });
};

export const createSocketClient = (
  serverAddress: string,
  userId: string
): Promise<ClientSocket> => {
  return new Promise((resolve) => {
    const token = generateToken(userId);
    const socket = Client(serverAddress, {
      auth: { token },
      autoConnect: false
    });

    socket.on('connect', () => {
      resolve(socket);
    });

    socket.connect();
  });
};

export const waitForEvent = (
  socket: ClientSocket,
  event: string,
  timeout = 1000
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${event}`));
    }, timeout);

    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}; 