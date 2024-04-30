import { Request, Response } from 'express'
import { ExpressErrorMiddlewareInterface, HttpError, Middleware } from 'routing-controllers'
import { Inject, Service } from 'typedi'
import LoggerInterface from '../service/logger/LoggerInterface'
import { errors } from '../errors'

@Service()
@Middleware({ type: 'after' })
export default class ErrorHandlerMiddleware implements ExpressErrorMiddlewareInterface {

  public constructor(
    @Inject('env') private readonly env: string,
    @Inject('logger') private readonly logger: LoggerInterface,
  ) {
  }

  public error(error: HttpError, _: Request, res: Response): void {
    const data = {
      name: error.name,
      type: error.constructor.name,
      message: error.message,
      errors: (error[`errors`] || []) as [],
      code: error.httpCode || 500,
    }

    for (const name in errors) {
      for (const key of [ data.name, data.type ]) {
        if (errors[name].types.includes(key)) {
          data.name = name
          data.code = errors[name].code
        }
      }
    }

    res.status(data.code).json(data)

    if (this.env === 'production') {
      this.logger.error(error.name, error.message)
    } else {
      this.logger.error(error.name, error.stack)
    }
  }
}
