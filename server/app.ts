import express from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import accountRoutes from './routes/accountRoutes';
import adminRoutes from './routes/adminRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import openApiDocument from '../openapi.json';
import { isDatabaseReady } from './db/mongo';

const app = express();
const clientDistPath = path.resolve(process.cwd(), 'client/dist');

app.use(express.json());

app.get('/api', (_req, res) => {
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

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(express.static(clientDistPath));

app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

export default app;
