import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';

interface LimiterOptions {
  windowMs: number; // length of the counting window
  limit: number; // requests allowed per IP address inside one window
  message: string;
  skip?: () => boolean; // return true to leave a request uncounted (used to switch limits off in tests)
}

// Rate limiting protects a public API from one visitor (or script) sending a flood of requests.
// Each IP address gets a counter that resets every window. Over the limit: HTTP 429 "Too Many Requests".
// Counters live in this server's memory, which is fine for one instance. Several instances would need a shared store.
export function createLimiter({ windowMs, limit, message, skip }: LimiterOptions): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    skip,
    standardHeaders: 'draft-7', // sends RateLimit headers so clients can see how much is left
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: { code: 'RATE_LIMITED', message } });
    },
  });
}
