import { Collection } from 'mongodb';
import { getDatabase } from '../db/mongo';
import { Account, AccountType } from '../models/account';

async function getCollection(): Promise<Collection<Account>> {
  const db = await getDatabase();
  return db.collection<Account>('accounts');
}

async function create(userId: number, accountType: AccountType): Promise<Account> {
  const collection = await getCollection();
  const account = new Account(Date.now(), userId, accountType);
  await collection.insertOne(account);
  return account;
}

async function findById(accountId: number): Promise<Account | undefined> {
  const collection = await getCollection();
  // findOne resolves to null on a miss; the repository contract is undefined
  return (await collection.findOne({ account_id: accountId })) ?? undefined;
}

async function findAll(): Promise<Account[]> {
  const collection = await getCollection();
  return collection.find({}).sort({ account_id: 1 }).toArray();
}

async function findByUserId(userId: number): Promise<Account[]> {
  const collection = await getCollection();
  return collection.find({ user_id: userId }).sort({ account_id: 1 }).toArray();
}

async function update(account: Account): Promise<Account> {
  const collection = await getCollection();
  const result = await collection.updateOne({ account_id: account.account_id }, { $set: account });
  if (result.matchedCount === 0) {
    throw new Error('Account not found');
  }
  return account;
}

async function deleteById(accountId: number): Promise<boolean> {
  const collection = await getCollection();
  const result = await collection.deleteOne({ account_id: accountId });
  return result.deletedCount > 0;
}

export default { create, findById, findAll, findByUserId, update, deleteById };
