import { Request, Response, NextFunction } from 'express';
import { ExpressErrorMiddlewareInterface, HttpError, Middleware } from 'routing-controllers';
import { Inject, Service } from "typedi";
import { LoggerInterface } from "../logger/LoggerInterface";

@Service()
@Middleware({ type: 'after' })
export default class ErrorHandlerMiddleware implements ExpressErrorMiddlewareInterface {

    constructor(
        @Inject('env') private readonly env: string,
        @Inject('logger') private readonly logger: LoggerInterface,
    ) {
    }

    public error(error: HttpError, req: Request, res: Response, next: NextFunction): void {
        res.status(error.httpCode || 500).json({
            name: error.name,
            message: error.message,
            errors: error[`errors`] || [],
        });

        if (this.env === 'production') {
            this.logger.error(error.name, error.message);
        } else {
            this.logger.error(error.name, error.stack);
        }
    }
}
