import 'dotenv/config';
import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'bankapp';

let client: MongoClient | null = null;
let database: Db | null = null;
let connectPromise: Promise<MongoClient> | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (database) {
    return database;
  }

  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to your .env file.');
  }

  if (!connectPromise) {
    connectPromise = new MongoClient(uri).connect();
  }

  client = await connectPromise;
  database = client.db(dbName);
  return database;
}

export async function getDatabase(): Promise<Db> {
  return connectToDatabase();
}

export async function closeDatabaseConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    database = null;
    connectPromise = null;
  }
}
