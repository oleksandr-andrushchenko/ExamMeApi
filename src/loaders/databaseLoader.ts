import { Application as express } from "express";
import { DataSource } from "typeorm";
import Container from "typedi";
import { useContainer as typeormUseContainer } from 'typeorm';
import { Container as typeormTypediContainer } from 'typeorm-typedi-extensions';

export const databaseLoader = async (app: express): Promise<DataSource> => {
    typeormUseContainer(typeormTypediContainer);

    const type: 'mongodb' = Container.get('dbType');
    const AppDataSource = new DataSource({
        type: type,
        url: Container.get('dbUrl'),
        synchronize: Container.get('dbSync'),
        logging: Container.get('dbLogs'),
        entities: ['../entities/*.ts'],
        migrations: ['../migrations/*.ts'],
        subscribers: ['../subscribers/*.ts'],
    });


    return await AppDataSource.initialize();
};

