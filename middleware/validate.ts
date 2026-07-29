import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

function formatError(error: { issues: { message: string }[] }): string {
  return error.issues.map((issue) => issue.message).join(', ');
}

/**
 * Middleware factory: validates req.body against the given Zod schema.
 * On failure, responds 400 with formatted errors and halts the chain.
 * On success, replaces req.body with the parsed result (transforms/defaults applied).
 */
export function validateBody(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: formatError(result.error) });
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Middleware factory: validates req.query against the given Zod schema.
 * On failure, responds 400 with formatted errors and halts the chain.
 * On success, replaces req.query with the parsed result (transforms/defaults applied).
 */
export function validateQuery(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({ error: formatError(result.error) });
      return;
    }
    req.query = result.data as typeof req.query;
    next();
  };
}
