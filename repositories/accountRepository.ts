import { ClientSession, Collection, Filter } from 'mongodb';
import { getNextId } from '../db/counters';
import { getDatabase } from '../db/mongo';
import { Account, AccountType } from '../models/account';

async function getCollection(): Promise<Collection<Account>> {
  const db = await getDatabase();
  return db.collection<Account>('accounts');
}

async function create(
  userId: number,
  accountType: AccountType,
  session?: ClientSession,
): Promise<Account> {
  const collection = await getCollection();
  const accountId = await getNextId('accounts', session);
  const account = new Account(accountId, userId, accountType);
  await collection.insertOne(account, { session });
  return account;
}

async function findById(
  accountId: number,
  session?: ClientSession,
): Promise<Account | undefined> {
  const collection = await getCollection();
  const account = await collection.findOne(
    { account_id: accountId },
    {
      session,
      projection: { _id: 0 },
    },
  );
  return account ?? undefined;
}

async function findAll(session?: ClientSession): Promise<Account[]> {
  const collection = await getCollection();
  return collection
    .find({}, { session, projection: { _id: 0 } })
    .sort({ account_id: 1 })
    .toArray();
}

async function findByUserId(
  userId: number,
  session?: ClientSession,
): Promise<Account[]> {
  const collection = await getCollection();
  return collection
    .find(
      { user_id: userId },
      {
        session,
        projection: { _id: 0 },
      },
    )
    .sort({ account_id: 1 })
    .toArray();
}

async function adjustBalance(
  accountId: number,
  deltaCents: number,
  session: ClientSession,
): Promise<Account | undefined> {
  const collection = await getCollection();
  const filter: Filter<Account> = {
    account_id: accountId,
    status: 'ACTIVE',
  };

  if (deltaCents < 0) {
    filter.balance_cents = { $gte: Math.abs(deltaCents) };
  }

  const account = await collection.findOneAndUpdate(
    filter,
    { $inc: { balance_cents: deltaCents } },
    {
      session,
      returnDocument: 'after',
      projection: { _id: 0 },
    },
  );
  return account ?? undefined;
}

async function closeById(
  accountId: number,
  session: ClientSession,
): Promise<Account | undefined> {
  const collection = await getCollection();
  const closedAt = new Date().toISOString();
  const account = await collection.findOneAndUpdate(
    {
      account_id: accountId,
      status: 'ACTIVE',
      balance_cents: 0,
    },
    {
      $set: {
        status: 'CLOSED',
        closed_at: closedAt,
      },
    },
    {
      session,
      returnDocument: 'after',
      projection: { _id: 0 },
    },
  );
  return account ?? undefined;
}

async function closeAllForUser(
  userId: number,
  session: ClientSession,
): Promise<void> {
  const collection = await getCollection();
  await collection.updateMany(
    {
      user_id: userId,
      status: 'ACTIVE',
      balance_cents: 0,
    },
    {
      $set: {
        status: 'CLOSED',
        closed_at: new Date().toISOString(),
      },
    },
    { session },
  );
}

export default {
  create,
  findById,
  findAll,
  findByUserId,
  adjustBalance,
  closeById,
  closeAllForUser,
};
