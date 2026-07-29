import { z } from 'zod';
import { AccountType, ACCOUNT_TYPES } from '../models/account';

const accountTypeEnum = z.enum(ACCOUNT_TYPES as [AccountType, ...AccountType[]]);

export const createAccountSchema = z.object({
  userId: z.coerce.number(),
  accountType: z.preprocess(
    (value) => (typeof value === 'string' ? value.toUpperCase() : value),
    accountTypeEnum,
  ),
});

export const amountSchema = z.object({
  amount_cents: z.coerce.number().int('amount_cents must be an integer'),
});

export const transferSchema = z.object({
  toAccountId: z.coerce.number(),
  amount_cents: z.coerce.number().int('amount_cents must be an integer'),
});

export const listAccountsQuerySchema = z.object({
  userId: z.coerce.number(),
});
