const express = require('express');
const accountController = require('../controllers/accountController');

const router = express.Router();

router.post('/', accountController.createAccount);
router.get('/:id', accountController.getAccount);
router.post('/:id/deposit', accountController.deposit);
router.post('/:id/withdraw', accountController.withdraw);
router.get('/:id/transactions', accountController.getTransactions);

module.exports = router;
