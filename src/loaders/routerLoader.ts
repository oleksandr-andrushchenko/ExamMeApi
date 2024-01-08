import Application from '../lib/app/Application';
import { ApplicationLoader } from "../lib/app/ApplicationLoader";
import { useExpressServer } from "routing-controllers";
import path from 'path';

export const routerLoader: ApplicationLoader = (app: Application): void => {
    useExpressServer(app, {
        controllers: [path.join(__dirname + '/../controllers/*.ts')],
    });
};

