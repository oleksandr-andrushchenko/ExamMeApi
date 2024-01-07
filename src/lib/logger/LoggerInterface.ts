export interface LoggerInterface {
    debug(message: string, ...args: any[]): this;

    info(message: string, ...args: any[]): this;

    warn(message: string, ...args: any[]): this;

    error(message: string, ...args: any[]): this;
}
