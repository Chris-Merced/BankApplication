import { WithId } from 'mongodb';

export type UserStatus = 'ACTIVE' | 'CLOSED';

export interface User {
  name: string;
  email: string;
  email_normalized: string;
  hash_password: string;
  status: UserStatus;
  created_at: string;
  closed_at: string | null;
}

export type PublicUser = Omit<
  User,
  'hash_password' | 'email_normalized'
> & {
  user_id: string;
};

export function createUserDocument(
  name: string,
  email: string,
  hashPassword: string,
): User {
  return {
    name,
    email,
    email_normalized: email.toLowerCase(),
    hash_password: hashPassword,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    closed_at: null,
  };
}

export function toPublicUser(user: WithId<User>): PublicUser {
  return {
    user_id: user._id.toHexString(),
    name: user.name,
    email: user.email,
    status: user.status,
    created_at: user.created_at,
    closed_at: user.closed_at,
  };
}
