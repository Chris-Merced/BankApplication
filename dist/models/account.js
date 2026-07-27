"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Account = exports.ACCOUNT_TYPES = void 0;
exports.ACCOUNT_TYPES = ['CHECKING', 'SAVINGS'];
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
