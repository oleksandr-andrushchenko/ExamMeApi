import { Application as express } from "express";
import { useContainer as routingControllerUserContainer, useExpressServer } from "routing-controllers";
import IndexController from "../controllers/IndexController";
import CompressionMiddleware from "../middlewares/CompressionMiddleware";
import LogMiddleware from "../middlewares/LogMiddleware";
import CategoryController from "../controllers/CategoryController";
import { Container } from "typedi";

export const expressLoader = (app: express): void => {
    routingControllerUserContainer(Container);

    useExpressServer(app, {
        controllers: [IndexController, CategoryController],
        middlewares: [CompressionMiddleware, LogMiddleware],
    });
};

