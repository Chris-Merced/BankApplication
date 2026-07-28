import express from 'express';
import swaggerUi from 'swagger-ui-express';
import accountRoutes from './routes/accountRoutes';
import openApiDocument from './openapi.json';

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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use('/api/accounts', accountRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
