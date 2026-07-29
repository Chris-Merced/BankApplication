import {
  ClientSession,
  Collection,
  Filter,
  ObjectId,
  WithId,
} from 'mongodb';
import { getDatabase } from '../db/mongo';
import {
  Account,
  AccountType,
  createAccountDocument,
} from '../models/account';

async function getCollection(): Promise<Collection<Account>> {
  const db = await getDatabase();
  return db.collection<Account>('accounts');
}

async function create(
  userId: ObjectId,
  accountType: AccountType,
  session?: ClientSession,
): Promise<WithId<Account>> {
  const collection = await getCollection();
  const account = createAccountDocument(userId, accountType);
  const result = await collection.insertOne(account, { session });
  return { ...account, _id: result.insertedId };
}

async function findById(
  accountId: ObjectId,
  session?: ClientSession,
): Promise<WithId<Account> | undefined> {
  const collection = await getCollection();
  return (
    (await collection.findOne({ _id: accountId }, { session })) ?? undefined
  );
}

async function findByUserId(
  userId: ObjectId,
  session?: ClientSession,
): Promise<WithId<Account>[]> {
  const collection = await getCollection();
  return collection
    .find({ user_id: userId }, { session })
    .sort({ created_at: 1 })
    .toArray();
}

async function adjustBalance(
  accountId: ObjectId,
  deltaCents: number,
  session: ClientSession,
): Promise<WithId<Account> | undefined> {
  const collection = await getCollection();
  const filter: Filter<Account> = {
    _id: accountId,
    status: 'ACTIVE',
  };
  if (deltaCents < 0) {
    filter.balance_cents = { $gte: Math.abs(deltaCents) };
  }

  return (
    (await collection.findOneAndUpdate(
      filter,
      { $inc: { balance_cents: deltaCents } },
      {
        session,
        returnDocument: 'after',
      },
    )) ?? undefined
  );
}

async function closeById(
  accountId: ObjectId,
  session: ClientSession,
): Promise<WithId<Account> | undefined> {
  const collection = await getCollection();
  return (
    (await collection.findOneAndUpdate(
      {
        _id: accountId,
        status: 'ACTIVE',
        balance_cents: 0,
      },
      {
        $set: {
          status: 'CLOSED',
          closed_at: new Date().toISOString(),
        },
      },
      {
        session,
        returnDocument: 'after',
      },
    )) ?? undefined
  );
}

async function closeAllForUser(
  userId: ObjectId,
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
  findByUserId,
  adjustBalance,
  closeById,
  closeAllForUser,
};
