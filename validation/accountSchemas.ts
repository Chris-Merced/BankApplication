import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { AccountType, ACCOUNT_TYPES } from '../models/account';

const objectIdString = z.string().refine((value) => ObjectId.isValid(value), {
  message: 'must be a valid MongoDB ObjectId',
});

// Cast: z.enum needs a non-empty tuple type; ACCOUNT_TYPES is a readonly array
const accountTypeEnum = z.enum(ACCOUNT_TYPES as [AccountType, ...AccountType[]]);

export const createAccountSchema = z.object({
  // Accept case-insensitive input ("checking" -> "CHECKING") before enum validation
  accountType: z.preprocess(
    (value) => (typeof value === 'string' ? value.toUpperCase() : value),
    accountTypeEnum,
  ),
});

export const amountSchema = z.object({
  amountCents: z.coerce.number().int('amountCents must be an integer'),
});

export const transferSchema = z.object({
  toAccountId: objectIdString,
  amountCents: z.coerce.number().int('amountCents must be an integer'),
});
