import { Application as express } from "express";
import { useExpressServer } from "routing-controllers";

export const expressLoader = (app: express): void => {
    useExpressServer(app, {
        controllers: [`${__dirname}/../controllers/*.ts`],
        middlewares: [`${__dirname}/../middlewares/*.ts`],
    });
};

