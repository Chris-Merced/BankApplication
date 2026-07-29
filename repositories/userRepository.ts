import {
  ClientSession,
  Collection,
  ObjectId,
  WithId,
} from 'mongodb';
import { getDatabase } from '../db/mongo';
import {
  createUserDocument,
  normalizeEmail,
  User,
} from '../models/user';

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
      { email: normalizeEmail(email) },
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
      { _id: userId },
      {
        $set: {
          name,
          email: normalizeEmail(email),
        },
      },
      { returnDocument: 'after' },
    )) ?? undefined
  );
}

async function deleteById(
  userId: ObjectId,
  session: ClientSession,
): Promise<boolean> {
  const collection = await getCollection();
  const result = await collection.deleteOne({ _id: userId }, { session });
  return result.deletedCount > 0;
}

export default {
  findById,
  findByEmail,
  create,
  updateProfile,
  deleteById,
};
