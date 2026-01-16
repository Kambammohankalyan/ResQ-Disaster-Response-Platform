import { Worker } from 'bullmq';
import connection from '../infrastructure/redis';
import path from 'path';

// CommonJS has __dirname available
const processorPath = path.join(__dirname, 'notification.processor.js');

export const notificationWorker = new Worker('notifications', processorPath, {
  connection: connection as any,
  concurrency: 5
});
