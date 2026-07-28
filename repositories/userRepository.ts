import { User } from '../models/user';

// Not real bcrypt hashes - these seed users are demo data only and can't log in.
const SEED_HASH_PLACEHOLDER = 'seed-placeholder-not-a-real-hash';

const users: User[] = [
  new User(1, 'Alice Johnson', 'alice@example.com', SEED_HASH_PLACEHOLDER),
  new User(2, 'Bob Smith', 'bob@example.com', SEED_HASH_PLACEHOLDER),
  new User(3, 'Carol Diaz', 'carol@example.com', SEED_HASH_PLACEHOLDER),
  new User(4, 'Dave Chen', 'dave@example.com', SEED_HASH_PLACEHOLDER),
  new User(5, 'Eve Patel', 'eve@example.com', SEED_HASH_PLACEHOLDER),
];
let nextUserId = users.length + 1;

function findById(userId: number): User | undefined {
  return users.find((u) => u.user_id === userId);
}

function findByEmail(email: string): User | undefined {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

function findAll(): User[] {
  return users;
}

function create(name: string, email: string, hashPassword: string): User {
  const user = new User(nextUserId++, name, email, hashPassword);
  users.push(user);
  return user;
}

function deleteById(userId: number): boolean {
  const index = users.findIndex((u) => u.user_id === userId);
  if (index === -1) {
    return false;
  }
  users.splice(index, 1);
  return true;
}

export default { findById, findByEmail, findAll, create, deleteById };
