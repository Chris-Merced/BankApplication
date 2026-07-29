import { Collection, WithId } from 'mongodb';
import { getDatabase } from '../db/mongo';
import { Transaction, TransactionType } from '../models/transaction';

async function getCollection(): Promise<Collection<Transaction>> {
  const db = await getDatabase();
  return db.collection<Transaction>('transactions');
}

async function create(
  accountId: number,
  txnType: TransactionType,
  amount: number,
  relatedAccountId: number | null = null,
): Promise<Transaction> {
  const collection = await getCollection();
  const txn = new Transaction(Date.now(), accountId, txnType, amount, relatedAccountId);
  await collection.insertOne(txn);
  return txn;
}

async function findById(txnId: number): Promise< WithId<Transaction> | null> {
  const collection = await getCollection();
  return collection.findOne({ txn_id: txnId });
}

async function findByAccountId(accountId: number): Promise<Transaction[]> {
  const collection = await getCollection();
  return collection.find({ account_id: accountId }).sort({ created_at: 1 }).toArray();
}

async function deleteById(txnId: number): Promise<boolean> {
  const collection = await getCollection();
  const result = await collection.deleteOne({ txn_id: txnId });
  return result.deletedCount > 0;
}

async function deleteByAccountId(accountId: number): Promise<void> {
  const collection = await getCollection();
  await collection.deleteMany({ account_id: accountId });
}

export default { create, findById, findByAccountId, deleteById, deleteByAccountId };
