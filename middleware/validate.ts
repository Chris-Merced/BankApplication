import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

function formatError(error: { issues: { message: string }[] }): string {
  return error.issues.map((issue) => issue.message).join(', ');
}

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
