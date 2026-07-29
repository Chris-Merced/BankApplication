import { ClientSession, Collection } from 'mongodb';
import { getDatabase } from './mongo';

interface Counter {
  _id: string;
  value: number;
}

async function getCollection(): Promise<Collection<Counter>> {
  const db = await getDatabase();
  return db.collection<Counter>('counters');
}

export async function getNextId(
  counterId: 'users' | 'accounts' | 'transactions',
  session?: ClientSession,
): Promise<number> {
  const collection = await getCollection();
  const counter = await collection.findOneAndUpdate(
    { _id: counterId },
    { $inc: { value: 1 } },
    {
      upsert: true,
      returnDocument: 'after',
      session,
    },
  );

  if (!counter) {
    throw new Error(`Could not generate the next ${counterId} ID`);
  }
  return counter.value;
}
