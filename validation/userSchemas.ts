import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const loginSchema = z.object({
  email: z.email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(1, 'Name is required').optional(),
    email: z.email('A valid email is required').optional(),
  })
  .refine((data) => data.name !== undefined || data.email !== undefined, {
    message: 'name and/or email must be provided',
  });
