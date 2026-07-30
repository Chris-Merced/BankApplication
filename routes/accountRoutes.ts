import { Router } from 'express';
import accountController from '../controllers/accountController';
import { authenticate } from '../middleware/authenticate';
import { validateBody } from '../middleware/validate';
import {
  createAccountSchema,
  amountSchema,
  transferSchema,
} from '../validation/accountSchemas';

const router = Router();

router.use(authenticate);
router.post('/', validateBody(createAccountSchema), accountController.createAccount);
router.get('/', accountController.listAccounts);
router.get('/:id', accountController.getAccount);
router.post('/:id/deposit', validateBody(amountSchema), accountController.deposit);
router.post('/:id/withdraw', validateBody(amountSchema), accountController.withdraw);
router.post('/:id/transfer', validateBody(transferSchema), accountController.transfer);
router.get('/:id/transactions', accountController.getTransactions);
router.delete('/:id', accountController.deleteAccount);
router.delete(
  '/:id/transactions/:txnId',
  accountController.deleteTransaction,
);

export default router;
