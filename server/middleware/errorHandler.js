const { AppError } = require('../utils/AppError')

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.statusCode || (err instanceof AppError ? err.statusCode : 500)
  const message =
    status === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Something went wrong'

  if (status === 500) {
    console.error('[error]', err)
  }

  res.status(status >= 400 ? status : 500).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && status === 500 && { stack: err.stack }),
  })
}

module.exports = { errorHandler }
