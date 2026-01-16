import Redis from 'ioredis';

// Singleton Redis Connection
const connection = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null // Required for BullMQ
});

export default connection;
