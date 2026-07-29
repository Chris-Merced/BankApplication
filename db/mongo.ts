import 'dotenv/config';
import {
  ClientSession,
  Db,
  MongoClient,
  ServerApiVersion,
  TransactionOptions,
} from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'bankapp';

let client: MongoClient | null = null;
let database: Db | null = null;
let connectPromise: Promise<MongoClient> | null = null;
let initializationPromise: Promise<void> | null = null;

async function migrateLegacyDocuments(db: Db): Promise<void> {
  await db.collection('accounts').updateMany(
    { balance_cents: { $exists: false } },
    [
      {
        $set: {
          balance_cents: {
            $round: [{ $multiply: [{ $ifNull: ['$balance', 0] }, 100] }, 0],
          },
          status: { $ifNull: ['$status', 'ACTIVE'] },
          closed_at: { $ifNull: ['$closed_at', null] },
        },
      },
      { $unset: 'balance' },
    ],
  );
  await db.collection('accounts').updateMany(
    { status: { $exists: false } },
    {
      $set: {
        status: 'ACTIVE',
        closed_at: null,
      },
    },
  );

  await db.collection('transactions').updateMany(
    { amount_cents: { $exists: false } },
    [
      {
        $set: {
          amount_cents: {
            $round: [{ $multiply: [{ $ifNull: ['$amount', 0] }, 100] }, 0],
          },
        },
      },
      { $unset: 'amount' },
    ],
  );

  await db.collection('users').updateMany(
    {},
    [
      {
        $set: {
          email_normalized: { $toLower: '$email' },
          status: { $ifNull: ['$status', 'ACTIVE'] },
          closed_at: { $ifNull: ['$closed_at', null] },
        },
      },
    ],
  );
}

async function seedCounter(
  db: Db,
  counterId: string,
  collectionName: string,
  idField: string,
): Promise<void> {
  const highest = await db
    .collection(collectionName)
    .find({}, { projection: { [idField]: 1 } })
    .sort({ [idField]: -1 })
    .limit(1)
    .next();
  const highestId = typeof highest?.[idField] === 'number' ? highest[idField] : 0;

  await db.collection<{ _id: string; value: number }>('counters').updateOne(
    { _id: counterId },
    { $max: { value: highestId } },
    { upsert: true },
  );
}

async function initializeDatabase(db: Db): Promise<void> {
  await migrateLegacyDocuments(db);

  await Promise.all([
    db.collection('users').createIndex({ user_id: 1 }, { unique: true }),
    db.collection('users').createIndex(
      { email_normalized: 1 },
      { unique: true },
    ),
    db.collection('accounts').createIndex({ account_id: 1 }, { unique: true }),
    db.collection('accounts').createIndex({ user_id: 1 }),
    db.collection('transactions').createIndex({ txn_id: 1 }, { unique: true }),
    db.collection('transactions').createIndex({
      account_id: 1,
      created_at: -1,
    }),
    db.collection('transactions').createIndex(
      { idempotency_key: 1 },
      {
        unique: true,
        partialFilterExpression: {
          idempotency_key: { $type: 'string' },
        },
      },
    ),
  ]);

  await Promise.all([
    seedCounter(db, 'users', 'users', 'user_id'),
    seedCounter(db, 'accounts', 'accounts', 'account_id'),
    seedCounter(db, 'transactions', 'transactions', 'txn_id'),
  ]);
}

export async function connectToDatabase(): Promise<Db> {
  if (database && initializationPromise) {
    await initializationPromise;
    return database;
  }

  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to your .env file.');
  }

  if (!connectPromise) {
    const mongoClient = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    connectPromise = mongoClient.connect();
  }

  client = await connectPromise;
  database = client.db(dbName);

  if (!initializationPromise) {
    initializationPromise = initializeDatabase(database);
  }
  await initializationPromise;

  await database.command({ ping: 1 });
  return database;
}

export async function getDatabase(): Promise<Db> {
  return connectToDatabase();
}

export async function runInTransaction<T>(
  operation: (session: ClientSession) => Promise<T>,
): Promise<T> {
  await connectToDatabase();
  if (!client) {
    throw new Error('MongoDB client is not connected');
  }

  const options: TransactionOptions = {
    readConcern: { level: 'snapshot' },
    writeConcern: { w: 'majority' },
    readPreference: 'primary',
  };

  return client.withSession((session) =>
    session.withTransaction(() => operation(session), options),
  );
}

export async function isDatabaseReady(): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  if (client) {
    await client.close();
  }
  client = null;
  database = null;
  connectPromise = null;
  initializationPromise = null;
}
