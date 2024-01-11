import app from './app';
import config from "./config";
import { Container } from "typedi";
import { LoggerInterface } from "./services/loggers/LoggerInterface";

app.listen(config.port, (): void => {
    const logger: LoggerInterface = Container.get('logger');
    logger.info(`Server is running on port ${config.port}`);
});
