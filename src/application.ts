import 'reflect-metadata';
import { DataSource, useContainer as typeormUseContainer, ConnectionManager } from 'typeorm';
import { Container } from "typedi";
import config from "./config";
import {
    useContainer as routingControllerUseContainer,
    useExpressServer,
    getMetadataArgsStorage,
} from "routing-controllers";
import express, { Application } from "express";
import LoggerInterface from "./service/logger/LoggerInterface";
import JwtTokenStrategyFactory from "./service/token/strategy/JwtTokenStrategyFactory";
import AuthService from "./service/auth/AuthService";
import TokenStrategyInterface from "./service/token/strategy/TokenStrategyInterface";
import { MongoConnectionOptions } from "typeorm/driver/mongodb/MongoConnectionOptions";
import { MongoDriver } from "typeorm/driver/mongodb/MongoDriver";
import { validationMetadatasToSchemas } from "class-validator-jsonschema";
import * as swaggerUiExpress from "swagger-ui-express";
import { routingControllersToSpec } from "routing-controllers-openapi";
import { RoutingControllersOptions } from "routing-controllers/types/RoutingControllersOptions";
import basicAuth from 'express-basic-auth';
import { MetadataStorage } from "class-transformer/types/MetadataStorage";
import NullLogger from "./service/logger/NullLogger";
import ClassValidatorValidator from "./service/validator/ClassValidatorValidator";
import WinstonLogger from "./service/logger/WinstonLogger";

type API = {
    dataSource: DataSource,
    app: Application,
    up: () => Promise<{
        app: Application,
        dataSource: DataSource,
        port: number,
        logger: LoggerInterface,
    }>,
    down: () => Promise<void>,
};

export default (): {
    dataSource: DataSource,
    api: () => API,
} => {
    typeormUseContainer(Container);

    Container.set('env', config.env);
    Container.set('loggerFormat', config.logger.format);
    Container.set('loggerLevel', config.logger.level);
    Container.set('authPermissions', config.auth.permissions);
    Container.set('validatorOptions', config.validator);
    Container.set('authPermissionHierarchy', config.auth.permissions);

    const logger: LoggerInterface = config.logger.enabled ? Container.get<WinstonLogger>(WinstonLogger) : new NullLogger();
    Container.set('logger', logger);

    Container.set('validator', Container.get<ClassValidatorValidator>(ClassValidatorValidator));

    const projectDir = config.projectDir;
    const mongoLogging = config.db.type === 'mongodb' && config.db.logging;

    const connectionManager = new ConnectionManager();
    Container.set(ConnectionManager, connectionManager);

    const dataSourceOptions: MongoConnectionOptions = {
        type: config.db.type,
        url: config.db.url,
        synchronize: config.db.synchronize,
        logging: config.db.logging,
        entities: [ `${projectDir}/src/entity/*.ts` ],
        subscribers: [ `${projectDir}/src/subscriber/*.ts` ],
        migrations: [ `${projectDir}/src/migration/*.ts` ],
        monitorCommands: mongoLogging,
    };

    const dataSource = connectionManager.create(dataSourceOptions);
    const upDataSource = async () => {
        await dataSource.initialize();

        if (mongoLogging) {
            const conn = (dataSource.driver as MongoDriver).queryRunner.databaseConnection;
            conn.on('commandStarted', (event) => logger.debug('commandStarted', event));
            conn.on('commandSucceeded', (event) => logger.debug('commandSucceeded', event));
            conn.on('commandFailed', (event) => logger.error('commandFailed', event));
        }
    };
    const downDataSource = async () => {
        await dataSource.destroy();
    };

    const api = (): API => {
        routingControllerUseContainer(Container);

        const tokenStrategy: TokenStrategyInterface = Container.get<JwtTokenStrategyFactory>(JwtTokenStrategyFactory).create(config.jwt);
        Container.set('tokenStrategy', tokenStrategy);

        const app = express();

        const authService: AuthService = Container.get<AuthService>(AuthService);

        const routingControllersOptions: RoutingControllersOptions = {
            authorizationChecker: authService.getAuthorizationChecker(),
            currentUserChecker: authService.getCurrentUserChecker(),
            controllers: [ `${projectDir}/src/controller/*.ts` ],
            middlewares: [ `${projectDir}/src/middleware/*.ts` ],
            cors: config.app.cors,
            validation: config.app.validator,
            classTransformer: true,
            defaultErrorHandler: false,
        };

        useExpressServer(app, routingControllersOptions);

        if (config.swagger.enabled) {
            const { defaultMetadataStorage } = require('class-transformer/cjs/storage');
            const spec = routingControllersToSpec(getMetadataArgsStorage(), routingControllersOptions, {
                components: {
                    // @ts-expect-error non-documented property
                    schemas: validationMetadatasToSchemas({
                        classTransformerMetadataStorage: defaultMetadataStorage as MetadataStorage,
                        refPointerPrefix: '#/components/schemas/',
                    }),
                    securitySchemes: {
                        // todo: move this part to authService
                        bearerAuth: {
                            type: 'http',
                            scheme: 'bearer',
                            bearerFormat: 'JWT',
                        },
                    },
                },
                info: {
                    description: config.app.description,
                    title: config.app.name,
                    version: config.app.version,
                },
            });
            app.use(
                config.swagger.route,
                basicAuth({
                    users: { [config.swagger.username]: config.swagger.password },
                    challenge: true,
                }),
                swaggerUiExpress.serve,
                swaggerUiExpress.setup(spec)
            );
        }

        const up = async () => {
            await upDataSource();

            const port = config.app.port;

            return { app, dataSource, port, logger };
        };

        const down = async () => {
            await downDataSource();
        };

        return { dataSource, app, up, down };
    }

    return { dataSource, api };
}