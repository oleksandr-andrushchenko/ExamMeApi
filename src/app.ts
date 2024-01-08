import 'reflect-metadata';
import express, { Application } from 'express';
import { containerLoader } from './loaders/containerLoader';
import { routerLoader } from './loaders/routerLoader';

const app: Application = express();

containerLoader(app);
routerLoader(app);

export default app;