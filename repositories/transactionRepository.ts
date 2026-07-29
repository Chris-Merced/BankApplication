import { ClientSession, Collection } from 'mongodb';
import { getNextId } from '../db/counters';
import { getDatabase } from '../db/mongo';
import { Transaction, TransactionType } from '../models/transaction';

async function getCollection(): Promise<Collection<Transaction>> {
  const db = await getDatabase();
  return db.collection<Transaction>('transactions');
}

async function create(
  accountId: number,
  txnType: TransactionType,
  amountCents: number,
  relatedAccountId: number | null,
  session: ClientSession,
  idempotencyKey?: string,
): Promise<Transaction> {
  const collection = await getCollection();
  const transactionId = await getNextId('transactions', session);
  const transaction = new Transaction(
    transactionId,
    accountId,
    txnType,
    amountCents,
    relatedAccountId,
    idempotencyKey,
  );
  await collection.insertOne(transaction, { session });
  return transaction;
}

async function findByAccountId(
  accountId: number,
  session?: ClientSession,
): Promise<Transaction[]> {
  const collection = await getCollection();
  return collection
    .find(
      { account_id: accountId },
      {
        session,
        projection: { _id: 0 },
      },
    )
    .sort({ created_at: -1 })
    .toArray();
}

export default { create, findByAccountId };
