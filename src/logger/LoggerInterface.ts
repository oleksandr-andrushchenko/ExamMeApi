export interface LoggerInterface {

    debug(message: string, ...args: any[]): LoggerInterface;

    info(message: string, ...args: any[]): LoggerInterface;

    warn(message: string, ...args: any[]): LoggerInterface;

    error(message: string, ...args: any[]): LoggerInterface;
}
