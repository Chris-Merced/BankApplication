import bcrypt from 'bcryptjs';
import { MongoServerError, ObjectId, WithId } from 'mongodb';
import { runInTransaction } from '../db/mongo';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../errors/AppError';
import { User } from '../models/user';
import accountRepository from '../repositories/accountRepository';
import userRepository from '../repositories/userRepository';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function createUser(
  name: string,
  email: string,
  password: string,
): Promise<WithId<User>> {
  const normalizedName = name.trim();
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedName) {
    throw new BadRequestError('Name is required');
  }
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new BadRequestError('A valid email is required');
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new BadRequestError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }
  if (await userRepository.findByEmail(normalizedEmail)) {
    throw new ConflictError('A user with this email already exists');
  }

  const hashPassword = await bcrypt.hash(password, SALT_ROUNDS);
  try {
    return await userRepository.create(
      normalizedName,
      normalizedEmail,
      hashPassword,
    );
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      throw new ConflictError('A user with this email already exists');
    }
    throw error;
  }
}

async function getUserById(userId: ObjectId): Promise<WithId<User>> {
  const user = await userRepository.findById(userId);
  if (!user || user.status !== 'ACTIVE') {
    throw new NotFoundError('User not found');
  }
  return user;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
}

async function updateUser(
  userId: ObjectId,
  updates: UpdateUserInput,
): Promise<WithId<User>> {
  const user = await getUserById(userId);

  let name = user.name;
  if (updates.name !== undefined) {
    name = updates.name.trim();
    if (!name) {
      throw new BadRequestError('Name is required');
    }
  }

  let email = user.email;
  if (updates.email !== undefined) {
    email = normalizeEmail(updates.email);
    if (!EMAIL_REGEX.test(email)) {
      throw new BadRequestError('A valid email is required');
    }
    const existing = await userRepository.findByEmail(email);
    if (existing && !existing._id.equals(userId)) {
      throw new ConflictError('A user with this email already exists');
    }
  }

  try {
    const updated = await userRepository.updateProfile(userId, name, email);
    if (!updated) {
      throw new NotFoundError('User not found');
    }
    return updated;
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      throw new ConflictError('A user with this email already exists');
    }
    throw error;
  }
}

async function closeUser(userId: ObjectId): Promise<void> {
  await runInTransaction(async (session) => {
    const user = await userRepository.findById(userId, session);
    if (!user || user.status !== 'ACTIVE') {
      throw new NotFoundError('User not found');
    }

    const accounts = await accountRepository.findByUserId(userId, session);
    const nonZeroAccount = accounts.find(
      (account) => account.balance_cents !== 0,
    );
    if (nonZeroAccount) {
      throw new ConflictError(
        `Cannot close user: account ${nonZeroAccount._id.toHexString()} has a non-zero balance`,
      );
    }

    await accountRepository.closeAllForUser(userId, session);
    const closed = await userRepository.closeById(userId, session);
    if (!closed) {
      throw new NotFoundError('User not found');
    }
  });
}

export default { createUser, getUserById, updateUser, closeUser };
