import express, { json, urlencoded, Response as ExResponse, Request as ExRequest } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { RegisterRoutes } from './build/routes';
import basicAuth from 'express-basic-auth';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { notificationQueue } from './queues/notification.queue';
import fs from 'fs';
import path from 'path';
import { ValidateError } from 'tsoa';
import { ApiError } from './utils/ApiError';

// Load Swagger JSON purely via FS to avoid import assertion issues in CJS/ESM mixed envs
const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, 'build', 'swagger.json'), 'utf8'));

export const app: express.Express = express();

app.use(urlencoded({ extended: true }));
app.use(json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173'],
  credentials: true
}));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Bull Board Setup
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(notificationQueue)],
  serverAdapter,
});

app.use(
  '/admin/queues',
  basicAuth({
    users: { 'admin': process.env.ADMIN_PASS || 'admin' },
    challenge: true,
  }),
  serverAdapter.getRouter()
);

// Serve Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

RegisterRoutes(app);

// Error Handler
app.use(function errorHandler(
  err: any,
  req: ExRequest,
  res: ExResponse,
  next: express.NextFunction
): ExResponse | void {
  console.error("🔥 Global Error Handler:", err); // Log the error!
  
  if (err instanceof ValidateError) {
    console.warn(`Caught Validation Error for ${req.path}:`, err.fields);
    return res.status(422).json({
      message: "Validation Failed",
      details: err?.fields,
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  if (err instanceof Error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message, // expose for debugging
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  next();
});
