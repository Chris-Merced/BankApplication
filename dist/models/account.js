"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Account = void 0;
class Account {
    constructor(id, userId, accountType, balance = 0) {
        this.account_id = id;
        this.user_id = userId;
        this.account_type = accountType;
        this.balance = balance;
        this.created_at = new Date().toISOString();
    }
}
exports.Account = Account;
