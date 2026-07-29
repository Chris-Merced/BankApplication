import { WithId } from 'mongodb';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export interface User {
  name: string;
  email: string;
  hash_password: string;
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
    created_at: new Date().toISOString(),
  };
}

export function toPublicUser(user: WithId<User>): PublicUser {
  return {
    user_id: user._id.toHexString(),
    name: user.name,
    email: user.email,
    created_at: user.created_at,
  };
}
