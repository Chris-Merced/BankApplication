import 'dotenv/config';
import serverlessHttp from 'serverless-http';
import type { Context, Handler } from 'aws-lambda';
import app from './app';
import { connectToDatabase } from './db/mongo';
import { assertAuthConfigured } from './services/AuthService';

assertAuthConfigured();
const dbReady = connectToDatabase();
const serverlessHandler = serverlessHttp(app);

export const handler: Handler = async (event, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await dbReady;
  return serverlessHandler(event, context);
};
