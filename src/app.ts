import 'reflect-metadata';
import express, { Request, Response, NextFunction, Application } from 'express';
import { containerLoader } from './loaders/containerLoader';

const app: Application = express();

containerLoader(app);

app.get('*', (req: Request, res: Response, next: NextFunction): Response<string> => {
    return res.status(200).send('Hello World');
});

export default app;