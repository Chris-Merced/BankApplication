import { User } from '../models/user';

const users: User[] = [
  new User(1, 'Alice Johnson', 'alice@example.com'),
  new User(2, 'Bob Smith', 'bob@example.com'),
  new User(3, 'Carol Diaz', 'carol@example.com'),
  new User(4, 'Dave Chen', 'dave@example.com'),
  new User(5, 'Eve Patel', 'eve@example.com'),
];

function findById(userId: number): User | undefined {
  return users.find((u) => u.user_id === userId);
}

function findAll(): User[] {
  return users;
}

export default { findById, findAll };
