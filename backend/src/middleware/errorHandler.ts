import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { logger } from '../config/logger';

// Runs when no route matched the request.
export function notFound(req: Request, res: Response) {
  res.status(404).json({
    // originalUrl keeps the full address even when this runs under app.use('/api', ...); drop the query string.
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl.split('?')[0]} not found` },
  });
}

// Express recognises an error handler by its four parameters.
// Any error thrown (or rejected promise) in a route ends up here, so every error response has the same shape.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }

  // express.json() throws this when the request body is not valid JSON.
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } });
    return;
  }

  // Anything else is a bug or an outage. Log the details, but never leak them to the client.
  logger.error(err, 'Unhandled error');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
}
