import pino from 'pino';

// Structured logging: each log line is JSON, so tools can search and filter it.
export const logger = pino({ level: process.env.NODE_ENV === 'test' ? 'silent' : 'info' });
