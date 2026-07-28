import { Collection } from 'mongodb';
import { getDatabase } from '../db/mongo';
import { User } from '../models/user';

async function getCollection(): Promise<Collection<User>> {
  const db = await getDatabase();
  return db.collection<User>('users');
}

async function findById(userId: number): Promise<User | undefined> {
  const collection = await getCollection();
  return collection.findOne({ user_id: userId });
}

async function findByEmail(email: string): Promise<User | undefined> {
  const collection = await getCollection();
  return collection.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
}

async function findAll(): Promise<User[]> {
  const collection = await getCollection();
  return collection.find({}).sort({ user_id: 1 }).toArray();
}

async function create(name: string, email: string, hashPassword: string): Promise<User> {
  const collection = await getCollection();
  const user = new User(Date.now(), name, email, hashPassword);
  await collection.insertOne(user);
  return user;
}

async function update(user: User): Promise<User> {
  const collection = await getCollection();
  const result = await collection.updateOne({ user_id: user.user_id }, { $set: user });
  if (result.matchedCount === 0) {
    throw new Error('User not found');
  }
  return user;
}

async function deleteById(userId: number): Promise<boolean> {
  const collection = await getCollection();
  const result = await collection.deleteOne({ user_id: userId });
  return result.deletedCount > 0;
}

export default { findById, findByEmail, findAll, create, update, deleteById };
