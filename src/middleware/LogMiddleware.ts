import { NextFunction, Request, Response } from 'express'
import morgan from 'morgan'
import { ExpressMiddlewareInterface, Middleware } from 'routing-controllers'
import { Inject, Service } from 'typedi'
import LoggerInterface from '../service/logger/LoggerInterface'

@Service()
@Middleware({ type: 'before' })
export default class LogMiddleware implements ExpressMiddlewareInterface {

  public constructor(
    @Inject('logger') private readonly logger: LoggerInterface,
    @Inject('loggerFormat') private readonly format: string,
  ) {
  }

  public use(req: Request, res: Response, next: NextFunction): void {
    morgan(this.format, {
      stream: {
        write: this.logger.info.bind(this.logger) as (str: string) => void,
      },
    })(req, res, next)
  }
}
