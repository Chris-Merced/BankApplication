import {
  ClientSession,
  Collection,
  ObjectId,
  WithId,
} from 'mongodb';
import { getDatabase } from '../db/mongo';
import { createUserDocument, User } from '../models/user';

async function getCollection(): Promise<Collection<User>> {
  const db = await getDatabase();
  return db.collection<User>('users');
}

async function findById(
  userId: ObjectId,
  session?: ClientSession,
): Promise<WithId<User> | undefined> {
  const collection = await getCollection();
  return (await collection.findOne({ _id: userId }, { session })) ?? undefined;
}

async function findByEmail(
  email: string,
  session?: ClientSession,
): Promise<WithId<User> | undefined> {
  const collection = await getCollection();
  return (
    (await collection.findOne(
      { email_normalized: email.trim().toLowerCase() },
      { session },
    )) ?? undefined
  );
}

async function create(
  name: string,
  email: string,
  hashPassword: string,
  session?: ClientSession,
): Promise<WithId<User>> {
  const collection = await getCollection();
  const user = createUserDocument(name, email, hashPassword);
  const result = await collection.insertOne(user, { session });
  return { ...user, _id: result.insertedId };
}

async function updateProfile(
  userId: ObjectId,
  name: string,
  email: string,
): Promise<WithId<User> | undefined> {
  const collection = await getCollection();
  return (
    (await collection.findOneAndUpdate(
      { _id: userId, status: 'ACTIVE' },
      {
        $set: {
          name,
          email,
          email_normalized: email.toLowerCase(),
        },
      },
      { returnDocument: 'after' },
    )) ?? undefined
  );
}

async function closeById(
  userId: ObjectId,
  session: ClientSession,
): Promise<WithId<User> | undefined> {
  const collection = await getCollection();
  return (
    (await collection.findOneAndUpdate(
      { _id: userId, status: 'ACTIVE' },
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

export default {
  findById,
  findByEmail,
  create,
  updateProfile,
  closeById,
};
