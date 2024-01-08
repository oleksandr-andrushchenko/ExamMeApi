import Application from '../lib/app/Application';
import { ApplicationLoader } from "../lib/app/ApplicationLoader";
import { Container } from "typedi";
import { WinstonDefaultLoggerFactory } from "../lib/factory/WinstonDefaultLoggerFactory";
import config from "../config";

export const containerLoader: ApplicationLoader = (app: Application): void => {
    Container.set('env', config.env);
    Container.set('loggerLevel', config.logger.level);
    Container.set('logger', Container.get(WinstonDefaultLoggerFactory).create());
};

