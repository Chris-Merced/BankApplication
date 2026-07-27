"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    constructor(id, name, email) {
        this.user_id = id;
        this.name = name;
        this.email = email;
        this.created_at = new Date().toISOString();
    }
}
exports.User = User;
