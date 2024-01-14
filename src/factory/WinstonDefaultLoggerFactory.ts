import { WinstonLogger } from "../logger/WinstonLogger";
import { Service, Inject } from "typedi";
import winston, { configure, format, transports } from 'winston';

@Service()
export class WinstonDefaultLoggerFactory {

    constructor(
        @Inject('env') private readonly env: string,
        @Inject('logger_level') private readonly level: string,
    ) {
    }

    public create(): WinstonLogger {
        const winstonLogger: winston.Logger = winston.clear();

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