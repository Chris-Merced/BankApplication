import {
  ClientSession,
  Collection,
  ObjectId,
  WithId,
} from 'mongodb';
import { getDatabase } from '../db/mongo';
import {
  createTransactionDocument,
  Transaction,
  TransactionType,
} from '../models/transaction';

async function getCollection(): Promise<Collection<Transaction>> {
  const db = await getDatabase();
  return db.collection<Transaction>('transactions');
}

async function create(
  accountId: ObjectId,
  txnType: TransactionType,
  amountCents: number,
  relatedAccountId: ObjectId | null,
  session: ClientSession,
  idempotencyKey?: string,
): Promise<WithId<Transaction>> {
  const collection = await getCollection();
  const transaction = createTransactionDocument(
    accountId,
    txnType,
    amountCents,
    relatedAccountId,
    idempotencyKey,
  );
  const result = await collection.insertOne(transaction, { session });
  return { ...transaction, _id: result.insertedId };
}

async function findByAccountId(
  accountId: ObjectId,
  session?: ClientSession,
): Promise<WithId<Transaction>[]> {
  const collection = await getCollection();
  return collection
    .find({ account_id: accountId }, { session })
    .sort({ created_at: -1 })
    .toArray();
}

async function findById(
  transactionId: ObjectId,
  session?: ClientSession,
): Promise<WithId<Transaction> | undefined> {
  const collection = await getCollection();
  return (
    (await collection.findOne({ _id: transactionId }, { session })) ??
    undefined
  );
}

async function deleteById(
  transactionId: ObjectId,
  session: ClientSession,
): Promise<boolean> {
  const collection = await getCollection();
  const result = await collection.deleteOne(
    { _id: transactionId },
    { session },
  );
  return result.deletedCount > 0;
}

async function deleteByAccountId(
  accountId: ObjectId,
  session: ClientSession,
): Promise<void> {
  const collection = await getCollection();
  await collection.deleteMany({ account_id: accountId }, { session });
}

export default {
  create,
  findByAccountId,
  findById,
  deleteById,
  deleteByAccountId,
};
