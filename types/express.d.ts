import { ObjectId } from 'mongodb';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: ObjectId;
      };
    }
  }
}

export {};
