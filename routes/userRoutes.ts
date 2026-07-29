import { Router } from 'express';
import userController from '../controllers/userController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);
router.get('/me', userController.getCurrentUser);
router.patch('/me', userController.updateCurrentUser);
router.delete('/me', userController.deleteCurrentUser);

export default router;
