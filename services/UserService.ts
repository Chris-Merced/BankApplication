import bcrypt from 'bcryptjs';
import userRepository from '../repositories/userRepository';
import accountRepository from '../repositories/accountRepository';
import AccountService from './AccountService';
import { User } from '../models/user';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALT_ROUNDS = 10; // Length of salt in hashed password
const MIN_PASSWORD_LENGTH = 8;

async function createUser(name: string, email: string, password: string): Promise<User> {
  if (!name.trim()) {
    throw new Error('Name is required');
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new Error('A valid email is required');
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (await userRepository.findByEmail(email)) {
    throw new Error('A user with this email already exists');
  }
  const hashPassword = bcrypt.hashSync(password, SALT_ROUNDS);
  return userRepository.create(name.trim(), email, hashPassword);
}

/**
 * Verifies an email/password pair against the stored bcrypt hash.
 *
 * An unknown email and a wrong password raise the identical error on purpose:
 * a distinct "no such user" message would let anyone probe which emails are
 * registered.
 */
async function login(email: string, password: string): Promise<User> {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  const user = await userRepository.findByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.hash_password)) {
    throw new Error('Invalid email or password');
  }
  return user;
}

async function getUserById(userId: number): Promise<User> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

async function getAllUsers(): Promise<User[]> {
  return userRepository.findAll();
}

interface UpdateUserInput {
  name?: string;
  email?: string;
}

async function updateUser(userId: number, updates: UpdateUserInput): Promise<User> {
  const user = await getUserById(userId);

  let name = user.name;
  if (updates.name !== undefined) {
    if (!updates.name.trim()) {
      throw new Error('Name is required');
    }
    name = updates.name.trim();
  }

  let email = user.email;
  if (updates.email !== undefined) {
    if (!EMAIL_REGEX.test(updates.email)) {
      throw new Error('A valid email is required');
    }
    const existing = await userRepository.findByEmail(updates.email);
    if (existing && existing.user_id !== userId) {
      throw new Error('A user with this email already exists');
    }
    email = updates.email;
  }

  const updatedUser: User = { ...user, name, email };
  return userRepository.update(updatedUser);
}

/**
 * Deletes a user and cascades to their accounts and transaction history.
 * Every account is checked for a zero balance up front so the cascade is
 * all-or-nothing rather than deleting some accounts and then failing.
 */
async function deleteUser(userId: number): Promise<void> {
  await getUserById(userId);
  const accounts = await accountRepository.findByUserId(userId);
  const nonZero = accounts.find((a) => a.balance_cents !== 0);
  if (nonZero) {
    throw new Error(`Cannot delete user: account ${nonZero.account_id} has a non-zero balance`);
  }
  for (const account of accounts) {
    await AccountService.deleteAccount(account.account_id);
  }
  await userRepository.deleteById(userId);
}

export default { createUser, login, getUserById, getAllUsers, updateUser, deleteUser };
