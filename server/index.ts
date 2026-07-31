import 'dotenv/config';
import { Server } from 'http';
import app from './app';
import { closeDatabaseConnection, connectToDatabase } from './db/mongo';
import { assertAuthConfigured } from './services/AuthService';

const PORT = process.env.PORT || 3000;
let server: Server | undefined;
let shuttingDown = false;

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
