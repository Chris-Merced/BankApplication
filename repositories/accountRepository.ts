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

async function deleteById(
  accountId: ObjectId,
  session: ClientSession,
): Promise<boolean> {
  const collection = await getCollection();
  const result = await collection.deleteOne({ _id: accountId }, { session });
  return result.deletedCount > 0;
}

export default {
  create,
  findById,
  findByUserId,
  adjustBalance,
  deleteById,
};
