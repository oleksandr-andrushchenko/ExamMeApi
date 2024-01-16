import { WinstonLogger } from "./WinstonLogger";
import { Service } from "typedi";
import winston, { configure, format, transports } from 'winston';

export type WinstonLoggerOptions = {
    level: string,
    format: string,
};

@Service()
export class WinstonLoggerFactory {

    public create(options: WinstonLoggerOptions): WinstonLogger {
        const winstonLogger: winston.Logger = winston.clear();

        configure({
            transports: [
                new transports.Console({
                    level: options.level,
                    handleExceptions: true,
                    format: options.format === 'dev'
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