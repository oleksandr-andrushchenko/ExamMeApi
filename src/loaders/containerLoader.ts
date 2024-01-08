import Application from '../services/app/Application';
import { ApplicationLoader } from "../services/app/ApplicationLoader";
import { Container } from "typedi";
import { WinstonDefaultLoggerFactory } from "../services/factory/WinstonDefaultLoggerFactory";
import config from "../config";
import { useContainer as routingControllerUserContainer } from "routing-controllers";

export const containerLoader: ApplicationLoader = (app: Application): void => {
    routingControllerUserContainer(Container);

    Container.set('env', config.env);
    Container.set('loggerLevel', config.logger.level);
    Container.set('logger', Container.get(WinstonDefaultLoggerFactory).create());
};

