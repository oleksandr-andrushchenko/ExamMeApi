import { Request, Response } from 'express'
import { ExpressErrorMiddlewareInterface, HttpError, Middleware } from 'routing-controllers'
import { Inject, Service } from 'typedi'
import LoggerInterface from '../service/logger/LoggerInterface'

@Service()
@Middleware({ type: 'after' })
export default class ErrorHandlerMiddleware implements ExpressErrorMiddlewareInterface {

  constructor(
    @Inject('env') private readonly env: string,
    @Inject('logger') private readonly logger: LoggerInterface,
  ) {
  }

  public error(error: HttpError, _: Request, res: Response): void {
    const code = error.httpCode || 500
    const data = {
      name: error.name,
      message: error.message,
      errors: (error[`errors`] || []) as [],
    }

    if (code === 400 && data.name === 'ParamRequiredError') {
      data.name = 'BadRequestError'
    }

    res.status(code).json(data)

    if (this.env === 'production') {
      this.logger.error(error.name, error.message)
    } else {
      this.logger.error(error.name, error.stack)
    }
  }
}
