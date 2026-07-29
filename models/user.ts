export type UserStatus = 'ACTIVE' | 'CLOSED';

export class User {
  user_id: number;
  name: string;
  email: string;
  email_normalized: string;
  hash_password: string;
  status: UserStatus;
  created_at: string;
  closed_at: string | null;

  constructor(id: number, name: string, email: string, hashPassword: string) {
    this.user_id = id;
    this.name = name;
    this.email = email;
    this.email_normalized = email.toLowerCase();
    this.hash_password = hashPassword;
    this.status = 'ACTIVE';
    this.created_at = new Date().toISOString();
    this.closed_at = null;
  }
}

export type PublicUser = Omit<User, 'hash_password' | 'email_normalized'>;

export function toPublicUser(user: User): PublicUser {
  const {
    hash_password: _hashPassword,
    email_normalized: _emailNormalized,
    ...publicUser
  } = user;
  return publicUser;
}
