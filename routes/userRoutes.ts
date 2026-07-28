import { Router } from 'express';
import userController from '../controllers/userController';

const router = Router();

router.post('/', userController.createUser);
router.get('/', userController.getUsers);
router.get('/:id', userController.getUser);
router.delete('/:id', userController.deleteUser);

export default router;
