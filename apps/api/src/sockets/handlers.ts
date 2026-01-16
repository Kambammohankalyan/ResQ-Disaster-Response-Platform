import { Server, Socket } from 'socket.io';

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.data.user?.id);
    
    socket.on('join_secure_room', (roomName: string) => {
      const user = socket.data.user; // Hydrated from handshake

      // RBAC Check for Room Access
      if (roomName.startsWith('admin_') && (!user.scopes || !user.scopes.includes('admin:access'))) {
        socket.emit('error', 'Unauthorized access to admin room');
        return;
      }

      // Tenant/Project Check stub
      if (roomName.startsWith('project_')) {
        // const projectId = roomName.split('_')[1];
      }

      socket.join(roomName);
      socket.emit('joined_room', roomName);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
};
