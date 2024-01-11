import { WinstonLogger } from "../loggers/WinstonLogger";
import { Service, Inject } from "typedi";
import winston, { configure, format, transports, Logger } from 'winston';

@Service()
export class WinstonDefaultLoggerFactory {
    constructor(
        @Inject('env') private readonly env: string,
        @Inject('loggerLevel') private readonly level: string,
    ) {
    }

    public create(): WinstonLogger {
        let winstonLogger: winston.Logger;

        winstonLogger = winston.clear();

        configure({
            transports: [
                new transports.Console({
                    level: this.level,
                    handleExceptions: true,
                    format: this.env === 'development'
                        ? format.combine(
                            format.splat(),
                            format.colorize(),
                            format.simple(),
                        )
                        : format.combine(
                            format.json(),
                        ),
                }),
            ],
        });

        return new WinstonLogger(winstonLogger);
    }
}