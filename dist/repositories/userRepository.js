"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("../models/user");
const users = [
    new user_1.User(1, 'Alice Johnson', 'alice@example.com'),
    new user_1.User(2, 'Bob Smith', 'bob@example.com'),
];
function findById(userId) {
    return users.find((u) => u.user_id === userId);
}
function findAll() {
    return users;
}
exports.default = { findById, findAll };
