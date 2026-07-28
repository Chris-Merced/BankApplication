export class User {
  user_id: number;
  name: string;
  email: string;
  hash_password: string;
  created_at: string;

  constructor(id: number, name: string, email: string, hashPassword: string) {
    this.user_id = id;
    this.name = name;
    this.email = email;
    this.hash_password = hashPassword;
    this.created_at = new Date().toISOString();
  }
}

export type PublicUser = Omit<User, 'hash_password'>;

export function toPublicUser(user: User): PublicUser {
  const { hash_password, ...publicUser } = user;
  return publicUser;
}
