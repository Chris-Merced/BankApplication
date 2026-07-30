import { ObjectId } from 'mongodb';
import { UserRole } from '../models/user';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: ObjectId;
        role: UserRole;
      };
    }
  }
}

export {};
