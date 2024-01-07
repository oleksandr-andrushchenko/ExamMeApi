import { LoggerInterface } from "./LoggerInterface";

export abstract class Logger implements LoggerInterface {
    public debug(message: string, ...args: any[]): this {
        return this.log('debug', message, args);
    }

    public info(message: string, ...args: any[]): this {
        return this.log('info', message, args);
    }

    public warn(message: string, ...args: any[]): this {
        return this.log('warn', message, args);
    }

    public error(message: string, ...args: any[]): this {
        return this.log('error', message, args);
    }

    protected abstract log(level: string, message: string, args: any[]): this;
}
