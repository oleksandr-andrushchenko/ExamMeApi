import Application from '../services/app/Application';
import { ApplicationLoader } from "../services/app/ApplicationLoader";
import { useExpressServer } from "routing-controllers";
import path from 'path';

export const routerLoader: ApplicationLoader = (app: Application): void => {
    useExpressServer(app, {
        controllers: [path.join(__dirname + '/../controllers/*.ts')],
        middlewares: [path.join(__dirname + '/../middlewares/*.ts')],
    });
};

