import { Router } from 'express';
import adminController from '../controllers/adminController';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUser);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id/role', adminController.setUserRole);

router.get('/accounts', adminController.listAccounts);
router.get('/accounts/:id', adminController.getAccount);
router.get('/accounts/:id/transactions', adminController.getAccountTransactions);

export default router;
