import 'reflect-metadata';
import { DataSource, useContainer as typeormUseContainer } from 'typeorm';
import { Container } from "typedi";
import config from "./config";
import { WinstonLoggerFactory } from "./logger/WinstonLoggerFactory";
import { useContainer as routingControllerUseContainer, useExpressServer } from "routing-controllers";
import express, { Application } from "express";
import { LoggerInterface } from "./logger/LoggerInterface";
import JwtTokenStrategyFactory from "./service/token/strategy/JwtTokenStrategyFactory";
import AuthService from "./service/auth/AuthService";
import TokenStrategyInterface from "./service/token/strategy/TokenStrategyInterface";
import { ValidatorOptions } from "class-validator/types/validation/ValidatorOptions";
import { MongoConnectionOptions } from "typeorm/driver/mongodb/MongoConnectionOptions";
import logTypeormMongoCommands from "./util/logTypeormMongoCommands";

export default async (): Promise<{
    app: Application,
    dataSource: DataSource,
    port: number,
    logger: LoggerInterface,
}> => {
    typeormUseContainer(Container);
    routingControllerUseContainer(Container);

    Container.set('env', config.env);
    Container.set('loggerFormat', config.logger.format);

    const logger: LoggerInterface = Container.get<WinstonLoggerFactory>(WinstonLoggerFactory).create(config.logger);
    Container.set('logger', logger);

    const projectDir = config.project_dir;
    const mongoLogging = config.db.type === 'mongodb' && config.db.logging;

    const dataSourceOptions: MongoConnectionOptions = {
        type: config.db.type,
        url: config.db.url,
        synchronize: config.db.synchronize,
        logging: config.db.logging,
        entities: [`${projectDir}/src/entity/*.ts`],
        subscribers: [`${projectDir}/src/subscriber/*.ts`],
        monitorCommands: mongoLogging,
    };

    const dataSource: DataSource = new DataSource(dataSourceOptions);
    Container.set('entityManager', dataSource.manager);
    await dataSource.initialize();

    mongoLogging && logTypeormMongoCommands(dataSource);

    const tokenStrategy: TokenStrategyInterface = Container.get<JwtTokenStrategyFactory>(JwtTokenStrategyFactory).create(config.jwt);
    Container.set('tokenStrategy', tokenStrategy);

    const app = express();

    const authService: AuthService = Container.get<AuthService>(AuthService);
    const validation: ValidatorOptions = {
        validationError: {
            target: false,
            value: false,
        },
    };

    useExpressServer(app, {
        authorizationChecker: authService.getAuthorizationChecker(),
        currentUserChecker: authService.getCurrentUserChecker(),
        controllers: [`${projectDir}/src/controller/*.ts`],
        middlewares: [`${projectDir}/src/middleware/*.ts`],
        validation: validation,
        classTransformer: true,
        defaultErrorHandler: false,
    });

    const port = config.port;

    return { app, dataSource, port, logger };
};