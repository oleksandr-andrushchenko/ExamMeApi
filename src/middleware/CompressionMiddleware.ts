import compression from 'compression';
import { NextFunction, Request, Response } from 'express';
import { ExpressMiddlewareInterface, Middleware } from 'routing-controllers';
import { Service } from "typedi";

@Service()
@Middleware({ type: 'before' })
export default class CompressionMiddleware implements ExpressMiddlewareInterface {

  public use(req: Request, res: Response, next: NextFunction): void {
    compression()(req, res, next);
  }
}
