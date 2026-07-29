import express from 'express';
import swaggerUi from 'swagger-ui-express';
import accountRoutes from './routes/accountRoutes';
import userRoutes from './routes/userRoutes';
import openApiDocument from './openapi.json';
import { connectToDatabase, closeDatabaseConnection } from './db/mongo';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Bank Application API is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/openapi.json', (_req, res) => {
  res.json(openApiDocument);
});

//Documents api routes and health information
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use('/api/accounts', accountRoutes);
app.use('/api/users', userRoutes);

async function startServer(): Promise<void> {
  try {
    await connectToDatabase();
    const server = app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });

    let shuttingDown = false;
    // Shut down express server gracefully along with database connection
    const shutdown = (signal: string) => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(`${signal} received, shutting down gracefully...`);

      server.close(async (err) => {
        if (err) {
          console.error('Error while closing HTTP server:', err);
        }
        try {
          await closeDatabaseConnection();
          console.log('Database connection closed.');
          process.exit(err ? 1 : 0);
        } catch (closeError) {
          console.error('Error while closing database connection:', closeError);
          process.exit(1);
        }
      });

      // Force-exit if connections don't close in time
      setTimeout(() => {
        console.error('Forced shutdown after timeout.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

startServer();
