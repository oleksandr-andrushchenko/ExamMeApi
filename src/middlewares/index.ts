import CompressionMiddleware from './CompressionMiddleware'
import ErrorHandlerMiddleware from './ErrorHandlerMiddleware'
import LogMiddleware from './LogMiddleware'

export const middlewares = [
  CompressionMiddleware,
  ErrorHandlerMiddleware,
  LogMiddleware,
]