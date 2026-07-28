import { Router } from 'express';
import accountController from '../controllers/accountController';

const router = Router();

router.post('/', accountController.createAccount);
router.get('/:id', accountController.getAccount);
router.post('/:id/deposit', accountController.deposit);
router.post('/:id/withdraw', accountController.withdraw);
router.post('/:id/transfer', accountController.transfer);
router.get('/:id/transactions', accountController.getTransactions);
router.delete('/:id', accountController.deleteAccount);
router.delete('/:id/transactions/:txnId', accountController.deleteTransaction);

export default router;
