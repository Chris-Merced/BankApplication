import { Router } from 'express';
import userController from '../controllers/userController';
import { authenticate } from '../middleware/authenticate';
import { validateBody } from '../middleware/validate';
import { updateUserSchema } from '../validation/userSchemas';

const router = Router();

router.use(authenticate);
router.get('/me', userController.getCurrentUser);
router.patch('/me', validateBody(updateUserSchema), userController.updateCurrentUser);
router.delete('/me', userController.deleteCurrentUser);

export default router;
