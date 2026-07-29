import { Router } from 'express';
import userController from '../controllers/userController';
import { validateBody } from '../middleware/validate';
import { createUserSchema, loginSchema, updateUserSchema } from '../validation/userSchemas';

const router = Router();

router.post('/', validateBody(createUserSchema), userController.createUser);
router.post('/login', validateBody(loginSchema), userController.login);
router.get('/', userController.getUsers);
router.get('/:id', userController.getUser);
router.patch('/:id', validateBody(updateUserSchema), userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
