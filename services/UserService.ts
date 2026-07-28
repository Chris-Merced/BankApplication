import bcrypt from 'bcryptjs';
import userRepository from '../repositories/userRepository';
import { User } from '../models/user';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALT_ROUNDS = 10;
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

export default { createUser, getUserById, getAllUsers };
