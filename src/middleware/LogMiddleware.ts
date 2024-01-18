import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { ExpressMiddlewareInterface, Middleware } from 'routing-controllers';
import { Inject, Service } from "typedi";
import LoggerInterface from "../logger/LoggerInterface";

@Service()
@Middleware({ type: 'before' })
export default class LogMiddleware implements ExpressMiddlewareInterface {

    constructor(
        @Inject('logger') private readonly logger: LoggerInterface,
        @Inject('loggerFormat') private readonly format: string,
    ) {
    }

    public use(req: Request, res: Response, next: NextFunction): any {
        return morgan(this.format, {
            stream: {
                write: this.logger.info.bind(this.logger),
            },
        })(req, res, next);
    }
}
