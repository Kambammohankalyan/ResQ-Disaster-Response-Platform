import { Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, decoded: any) => {
    if (err) return next(new Error('Authentication error: Invalid token'));
    
    // Hydrate the socket instance with user data
    socket.data.user = decoded; 
    next();
  });
};
