import 'reflect-metadata';
import express from 'express';
import { containerLoader } from './loaders/containerLoader';
import { expressLoader } from './loaders/expressLoader';

const app = express();

containerLoader(app);
expressLoader(app);

export default app;