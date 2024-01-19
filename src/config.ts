import Joi from 'joi';
import path from "path";
// @ts-ignore
import pkg from "../package.json";

const schema: Joi.ObjectSchema = Joi.object()
    .keys({
        NODE_ENV: Joi.string().valid('development').default('development').description('Node env'),
        PORT: Joi.number().default(8080).description('Web server port number'),
        DATABASE_TYPE: Joi.string().default('mongodb').description('Database typeorm type'),
        DATABASE_URL: Joi.string().uri().default('mongodb://root:1111@mongo:27017/test?authSource=admin').description('Database connection url'),
    })
    .unknown();

const { value: env, error } = schema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const environment: string = env.NODE_ENV;

export default {
    env: environment,
    project_dir: path.resolve(__dirname, '..'),
    app: {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        port: env.PORT,
    },
    logger: {
        level: environment === 'development' ? 'debug' : 'info',
        format: environment === 'development' ? 'dev' : 'tiny',
    },
    db: {
        type: env.DATABASE_TYPE,
        url: env.DATABASE_URL,
        synchronize: false,
        logging: environment === 'development',
    },
    jwt: {
        secret: 'any',
    },
    swagger: {
        enabled: environment === 'development',
        route: '/docs',
        username: 'any',
        password: 'any',
    },
};
