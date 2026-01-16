import 'dotenv/config';
import mongoose from 'mongoose';
// Eagerly load models to register schemas
import './models/Permission';
import './models/Role';
import './models/User';
import './models/Incident';

import { app } from './app';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { socketAuthMiddleware } from './sockets/middleware';
import { setupSocketHandlers } from './sockets/handlers';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resq?directConnection=true';
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Socket Middleware
io.use(socketAuthMiddleware);

// Socket Handlers
setupSocketHandlers(io);

// MongoDB Connection with Geospatial support
const connectDB = async () => {
  try {
    console.log('🔌 Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected (Replica Set Ready)');
  } catch (err) {
    console.error('❌ DB Connection Failed', err);
    process.exit(1);
  }
};

httpServer.listen(4000, () => {
  connectDB();
  console.log('🚀 ResQ Core running on port 4000');
  console.log('📚 Swagger Docs available at http://localhost:4000/docs');
});