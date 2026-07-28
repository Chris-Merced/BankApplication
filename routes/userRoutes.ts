import { Router } from 'express';
import userController from '../controllers/userController';

const router = Router();

router.post('/', userController.createUser);
router.post('/login', userController.login);
router.get('/', userController.getUsers);
router.get('/:id', userController.getUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
