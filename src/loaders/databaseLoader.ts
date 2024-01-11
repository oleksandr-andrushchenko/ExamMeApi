import { Application as express } from "express";
import { DataSource } from "typeorm";
import Container from "typedi";
import { useContainer as typeormUseContainer } from 'typeorm';
import { Container as typeormTypediContainer } from 'typeorm-typedi-extensions';

export const databaseLoader = async (app: express): Promise<DataSource> => {
    typeormUseContainer(typeormTypediContainer);

    const AppDataSource: DataSource = Container.get('dataSource');

    return await AppDataSource.initialize();
};

