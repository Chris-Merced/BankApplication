import bcrypt from 'bcryptjs';
import userRepository from '../repositories/userRepository';
import accountRepository from '../repositories/accountRepository';
import AccountService from './AccountService';
import { User } from '../models/user';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALT_ROUNDS = 10; // Length of salt in hashed password
const MIN_PASSWORD_LENGTH = 8;

function createUser(name: string, email: string, password: string): User {
  if (!name.trim()) {
    throw new Error('Name is required');
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new Error('A valid email is required');
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (userRepository.findByEmail(email)) {
    throw new Error('A user with this email already exists');
  }
  const hashPassword = bcrypt.hashSync(password, SALT_ROUNDS);
  return userRepository.create(name.trim(), email, hashPassword);
}

function getUserById(userId: number): User {
  const user = userRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

function getAllUsers(): User[] {
  return userRepository.findAll();
}

/**
 * Deletes a user and cascades to their accounts and transaction history.
 * Every account is checked for a zero balance up front so the cascade is
 * all-or-nothing rather than deleting some accounts and then failing.
 */
function deleteUser(userId: number): void {
  getUserById(userId);
  const accounts = accountRepository.findByUserId(userId);
  const nonZero = accounts.find((a) => a.balance !== 0);
  if (nonZero) {
    throw new Error(`Cannot delete user: account ${nonZero.account_id} has a non-zero balance`);
  }
  for (const account of accounts) {
    AccountService.deleteAccount(account.account_id);
  }
  userRepository.deleteById(userId);
}

export default { createUser, getUserById, getAllUsers, deleteUser };
