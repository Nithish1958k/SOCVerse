// Wraps async route handlers so thrown errors reach the error middleware.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// 404 fallthrough.
export function notFound(req, res) {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
}

// Centralized error handler. Keep last in the middleware chain.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }
  res.status(status).json({
    error: err.name || 'Error',
    message: err.message || 'Unexpected error',
    ...(err.errors ? { details: err.errors } : {}),
  });
}
