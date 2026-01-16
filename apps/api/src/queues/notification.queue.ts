import { Queue } from 'bullmq';
import connection from '../infrastructure/redis';

export const notificationQueue = new Queue('notifications', {
  connection: connection as any
});
