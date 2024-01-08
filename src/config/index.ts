import env from './env';

const environment: string = env.NODE_ENV;

export default {
    env: environment,
    port: env.PORT,
    logger: {
        level: environment === 'development' ? 'debug' : 'info',
    }
};
