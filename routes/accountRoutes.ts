import { Router } from 'express';
import accountController from '../controllers/accountController';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createAccountSchema,
  amountSchema,
  transferSchema,
  listAccountsQuerySchema,
} from '../validation/accountSchemas';

const router = Router();

router.post('/', validateBody(createAccountSchema), accountController.createAccount);
router.get('/', validateQuery(listAccountsQuerySchema), accountController.listAccounts);
router.get('/:id', accountController.getAccount);
router.post('/:id/deposit', validateBody(amountSchema), accountController.deposit);
router.post('/:id/withdraw', validateBody(amountSchema), accountController.withdraw);
router.post('/:id/transfer', validateBody(transferSchema), accountController.transfer);
router.get('/:id/transactions', accountController.getTransactions);
router.delete('/:id', accountController.deleteAccount);
router.delete('/:id/transactions/:txnId', accountController.deleteTransaction);

export default router;
