import 'reflect-metadata';
import express from 'express';
import { containerLoader } from './loaders/containerLoader';
import { expressLoader } from './loaders/expressLoader';
import { databaseLoader } from "./loaders/databaseLoader";

const app = express();

containerLoader(app);
databaseLoader(app);
expressLoader(app);

export default app;