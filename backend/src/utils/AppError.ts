// An error we throw on purpose, carrying the HTTP status the client should receive.
// Example: throw new AppError(404, 'NOT_FOUND', 'Village not found');
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
