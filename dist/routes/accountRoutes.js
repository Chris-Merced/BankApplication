"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const accountController_1 = __importDefault(require("../controllers/accountController"));
const router = (0, express_1.Router)();
router.post('/', accountController_1.default.createAccount);
router.get('/:id', accountController_1.default.getAccount);
router.post('/:id/deposit', accountController_1.default.deposit);
router.post('/:id/withdraw', accountController_1.default.withdraw);
router.get('/:id/transactions', accountController_1.default.getTransactions);
exports.default = router;
