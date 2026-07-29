import 'dotenv/config';
import {
  ClientSession,
  Db,
  MongoClient,
  MongoServerError,
  ObjectId,
  ServerApiVersion,
  TransactionOptions,
} from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'bankapp';

let client: MongoClient | null = null;
let database: Db | null = null;
let connectPromise: Promise<MongoClient> | null = null;
let initializationPromise: Promise<void> | null = null;

async function removeLegacyIdInfrastructure(db: Db): Promise<void> {
  const legacyIndexes: Array<[string, string]> = [
    ['users', 'user_id_1'],
    ['accounts', 'account_id_1'],
    ['transactions', 'txn_id_1'],
  ];

  for (const [collectionName, indexName] of legacyIndexes) {
    try {
      await db.collection(collectionName).dropIndex(indexName);
    } catch (error) {
      if (!(error instanceof MongoServerError && error.code === 27)) {
        throw error;
      }
    }
  }

  try {
    await db.collection('counters').drop();
  } catch (error) {
    if (!(error instanceof MongoServerError && error.code === 26)) {
      throw error;
    }
  }
}

async function migrateLegacyMoneyFields(db: Db): Promise<void> {
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
    { $set: { status: 'ACTIVE', closed_at: null } },
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

async function migrateLegacyNumericIds(db: Db): Promise<void> {
  const users = await db
    .collection('users')
    .find(
      { user_id: { $type: 'number' } },
      { projection: { _id: 1, user_id: 1 } },
    )
    .toArray();
  const userIds = new Map<number, ObjectId>();
  for (const user of users) {
    if (typeof user.user_id === 'number') {
      userIds.set(user.user_id, user._id);
    }
  }

  const accounts = await db
    .collection('accounts')
    .find(
      { account_id: { $type: 'number' } },
      { projection: { _id: 1, account_id: 1, user_id: 1 } },
    )
    .toArray();
  const accountIds = new Map<number, ObjectId>();
  for (const account of accounts) {
    if (typeof account.account_id === 'number') {
      accountIds.set(account.account_id, account._id);
    }
  }

  const transactions = await db
    .collection('transactions')
    .find(
      { txn_id: { $type: 'number' } },
      {
        projection: {
          _id: 1,
          account_id: 1,
          related_account_id: 1,
          txn_id: 1,
        },
      },
    )
    .toArray();

  const transactionUpdates = transactions.map((transaction) => {
    const accountId =
      transaction.account_id instanceof ObjectId
        ? transaction.account_id
        : accountIds.get(transaction.account_id);
    if (!accountId) {
      throw new Error(
        `Cannot migrate transaction ${String(transaction.txn_id)}: account reference not found`,
      );
    }

    let relatedAccountId: ObjectId | null = null;
    if (transaction.related_account_id instanceof ObjectId) {
      relatedAccountId = transaction.related_account_id;
    } else if (typeof transaction.related_account_id === 'number') {
      relatedAccountId = accountIds.get(transaction.related_account_id) ?? null;
      if (!relatedAccountId) {
        throw new Error(
          `Cannot migrate transaction ${String(transaction.txn_id)}: related account reference not found`,
        );
      }
    }

    return db.collection('transactions').updateOne(
      { _id: transaction._id },
      {
        $set: {
          account_id: accountId,
          related_account_id: relatedAccountId,
        },
        $unset: { txn_id: '' },
      },
    );
  });
  await Promise.all(transactionUpdates);

  const accountUpdates = accounts.map((account) => {
    const userId =
      account.user_id instanceof ObjectId
        ? account.user_id
        : userIds.get(account.user_id);
    if (!userId) {
      throw new Error(
        `Cannot migrate account ${String(account.account_id)}: user reference not found`,
      );
    }
    return db.collection('accounts').updateOne(
      { _id: account._id },
      {
        $set: { user_id: userId },
        $unset: { account_id: '' },
      },
    );
  });
  await Promise.all(accountUpdates);

  if (users.length > 0) {
    await db.collection('users').updateMany(
      { user_id: { $type: 'number' } },
      { $unset: { user_id: '' } },
    );
  }
}

async function initializeDatabase(db: Db): Promise<void> {
  await migrateLegacyMoneyFields(db);
  await removeLegacyIdInfrastructure(db);
  await migrateLegacyNumericIds(db);

  await Promise.all([
    db.collection('users').createIndex(
      { email_normalized: 1 },
      { unique: true },
    ),
    db.collection('accounts').createIndex({ user_id: 1 }),
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
