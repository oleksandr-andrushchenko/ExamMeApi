import 'reflect-metadata';
import { useContainer as typeormUseContainer } from 'typeorm';
import { Container } from "typedi";
import config from "./config";
import { WinstonDefaultLoggerFactory } from "./factory/WinstonDefaultLoggerFactory";
import { TypeormDefaultDataSourceFactory } from "./factory/TypeormDefaultDataSourceFactory";
import { useContainer as routingControllerUserContainer, useExpressServer } from "routing-controllers";
import express, { Application } from "express";
import { LoggerInterface } from "./logger/LoggerInterface";

export default async (): Promise<{ server: Application, port: number, logger: LoggerInterface }> => {
    typeormUseContainer(Container);

    const projectDir = config.project_dir;

    // primitives
    Container.set([
        { id: 'env', value: config.env },
        { id: 'project_dir', value: projectDir },
        { id: 'port', value: config.port },
        { id: 'logger_level', value: config.logger.level },
        { id: 'logger_format', value: config.logger.format },
        { id: 'db_type', value: config.db.type },
        { id: 'db_url', value: config.db.url },
        { id: 'db_synchronize', value: config.db.synchronize },
        { id: 'db_logging', value: config.db.logging },
    ]);


    const logger = Container.get<WinstonDefaultLoggerFactory>(WinstonDefaultLoggerFactory).create();
    const dataSource = Container.get<TypeormDefaultDataSourceFactory>(TypeormDefaultDataSourceFactory).create();

    // constructable
    Container.set([
        { id: 'logger', value: logger },
        { id: 'data_source', value: dataSource },
    ]);

    routingControllerUserContainer(Container);

    const server = express();

    useExpressServer(server, {
        controllers: [`${projectDir}/src/controller/*.ts`],
        middlewares: [`${projectDir}/src/middleware/*.ts`],
    });

    await dataSource.initialize();

    const port = config.port;

    return { server, port, logger };
};