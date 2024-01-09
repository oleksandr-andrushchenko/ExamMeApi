import { Container } from "typedi";
import { WinstonDefaultLoggerFactory } from "../services/factory/WinstonDefaultLoggerFactory";
import config from "../config";
import { useContainer as routingControllerUserContainer } from "routing-controllers";
import { Application as express } from "express";

export const containerLoader = (app: express): void => {
    Container.set('env', config.env);
    Container.set('loggerLevel', config.logger.level);
    Container.set('logger', Container.get(WinstonDefaultLoggerFactory).create());

    routingControllerUserContainer(Container);
};

