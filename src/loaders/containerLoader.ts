import { Container } from "typedi";
import { WinstonDefaultLoggerFactory } from "../services/factories/WinstonDefaultLoggerFactory";
import config from "../config";
import { Application as express } from "express";
import { TypeormDefaultDataSourceFactory } from "../services/factories/TypeormDefaultDataSourceFactory";

export const containerLoader = (app: express): void => {
    Container.set('env', config.env);
    Container.set('loggerLevel', config.logger.level);
    Container.set('loggerFormat', config.logger.format);
    const winstonDefaultLoggerFactory = Container.get(WinstonDefaultLoggerFactory);
    Container.set('logger', winstonDefaultLoggerFactory.create());
    Container.set('dbType', config.db.type);
    Container.set('dbUrl', config.db.url);
    Container.set('dbSync', config.db.synchronize);
    Container.set('dbLogs', config.db.logging);
    const typeormDefaultDataSourceFactory = Container.get(TypeormDefaultDataSourceFactory);
    Container.set('dataSource', typeormDefaultDataSourceFactory.create());
};

