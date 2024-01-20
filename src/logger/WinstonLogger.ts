import LoggerInterface from "./LoggerInterface";
import winston from 'winston';
import Logger from "./Logger";

export default class WinstonLogger extends Logger implements LoggerInterface {

    constructor(private readonly winstonLogger: winston.Logger) {
        super();
    }

    protected log(level: string, message: string, args: unknown[]): LoggerInterface {
        this.winstonLogger.log(level, message, args);

        return this;
    }
}
