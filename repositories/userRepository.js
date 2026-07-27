const User = require('../models/user');

const users = [
  new User(1, 'Alice Johnson', 'alice@example.com'),
  new User(2, 'Bob Smith', 'bob@example.com'),
];

function findById(userId) {
  return users.find((u) => u.user_id === userId);
}

function findAll() {
  return users;
}

module.exports = { findById, findAll };
