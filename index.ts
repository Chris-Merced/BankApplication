import 'dotenv/config';
import express from 'express';
import { Server } from 'http';
import swaggerUi from 'swagger-ui-express';
import accountRoutes from './routes/accountRoutes';
import adminRoutes from './routes/adminRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import openApiDocument from './openapi.json';
import {
  closeDatabaseConnection,
  connectToDatabase,
  isDatabaseReady,
} from './db/mongo';
import { assertAuthConfigured } from './services/AuthService';

const app = express();
const PORT = process.env.PORT || 3000;
let server: Server | undefined;
let shuttingDown = false;

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'Bank Application API is running' });
});

app.get('/health', async (_req, res) => {
  const ready = await isDatabaseReady();
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ok' : 'unavailable',
    database: ready ? 'connected' : 'disconnected',
  });
});

app.get('/health/live', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/openapi.json', (_req, res) => {
  res.json(openApiDocument);
});

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    swaggerOptions: {
      validatorUrl: null,
      persistAuthorization: false,
    },
  }),
);
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

async function startServer(): Promise<void> {
  try {
    assertAuthConfigured();
    await connectToDatabase();
    server = app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  console.log(`${signal} received, shutting down`);

  if (server) {
    await new Promise<void>((resolve, reject) => {
      server!.close((error) => (error ? reject(error) : resolve()));
    });
  }
  await closeDatabaseConnection();
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    shutdown(signal)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Failed to shut down cleanly:', error);
        process.exit(1);
      });
  });
}

startServer();
