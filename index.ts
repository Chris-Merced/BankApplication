import express from 'express';
import swaggerUi from 'swagger-ui-express';
import accountRoutes from './routes/accountRoutes';
import userRoutes from './routes/userRoutes';
import openApiDocument from './openapi.json';
import { connectToDatabase } from './db/mongo';

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
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

startServer();
