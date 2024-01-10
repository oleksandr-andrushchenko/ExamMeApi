import env from './env';

const environment: string = env.NODE_ENV;

export default {
    env: environment,
    port: env.PORT,
    logger: {
        level: environment === 'development' ? 'debug' : 'info',
        format: environment === 'development' ? 'dev' : 'tiny',
    },
    db: {
        type: env.DATABASE_TYPE,
        url: env.DATABASE_URL,
        synchronize: environment === 'development',
        logging: environment === 'development',

    }
};
