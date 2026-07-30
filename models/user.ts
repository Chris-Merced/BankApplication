import { WithId } from 'mongodb';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type UserRole = 'user' | 'admin';

export const USER_ROLES: UserRole[] = ['user', 'admin'];

export interface User {
  name: string;
  email: string;
  hash_password: string;
  role: UserRole;
  created_at: string;
}

export type PublicUser = Omit<User, 'hash_password'> & {
  user_id: string;
};

export function createUserDocument(
  name: string,
  email: string,
  hashPassword: string,
): User {
  return {
    name,
    email: normalizeEmail(email),
    hash_password: hashPassword,
    role: 'user',
    created_at: new Date().toISOString(),
  };
}

export function toPublicUser(user: WithId<User>): PublicUser {
  return {
    user_id: user._id.toHexString(),
    name: user.name,
    email: user.email,
    role: user.role ?? 'user',
    created_at: user.created_at,
  };
}
