import { ClientSession, Collection } from 'mongodb';
import { getNextId } from '../db/counters';
import { getDatabase } from '../db/mongo';
import { User } from '../models/user';

async function getCollection(): Promise<Collection<User>> {
  const db = await getDatabase();
  return db.collection<User>('users');
}

async function findById(
  userId: number,
  session?: ClientSession,
): Promise<User | undefined> {
  const collection = await getCollection();
  const user = await collection.findOne(
    { user_id: userId },
    {
      session,
      projection: { _id: 0 },
    },
  );
  return user ?? undefined;
}

async function findByEmail(
  email: string,
  session?: ClientSession,
): Promise<User | undefined> {
  const collection = await getCollection();
  const user = await collection.findOne(
    { email_normalized: email.trim().toLowerCase() },
    {
      session,
      projection: { _id: 0 },
    },
  );
  return user ?? undefined;
}

async function create(
  name: string,
  email: string,
  hashPassword: string,
  session?: ClientSession,
): Promise<User> {
  const collection = await getCollection();
  const userId = await getNextId('users', session);
  const user = new User(userId, name, email, hashPassword);
  await collection.insertOne(user, { session });
  return user;
}

async function updateProfile(
  userId: number,
  name: string,
  email: string,
): Promise<User | undefined> {
  const collection = await getCollection();
  const user = await collection.findOneAndUpdate(
    {
      user_id: userId,
      status: 'ACTIVE',
    },
    {
      $set: {
        name,
        email,
        email_normalized: email.toLowerCase(),
      },
    },
    {
      returnDocument: 'after',
      projection: { _id: 0 },
    },
  );
  return user ?? undefined;
}

async function closeById(
  userId: number,
  session: ClientSession,
): Promise<User | undefined> {
  const collection = await getCollection();
  const user = await collection.findOneAndUpdate(
    {
      user_id: userId,
      status: 'ACTIVE',
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
      projection: { _id: 0 },
    },
  );
  return user ?? undefined;
}

export default {
  findById,
  findByEmail,
  create,
  updateProfile,
  closeById,
};
