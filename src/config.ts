import Joi from 'joi'
import path from 'path'
// @ts-ignore
import pkg from '../package.json'
import Permission from './enum/Permission'

const schema: Joi.ObjectSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().required().valid('development', 'test').example('development').description('Node env'),
    PORT: Joi.number().required().example('8080').description('Web server port number'),
    DATABASE_TYPE: Joi.string().required().valid('mongodb').example('mongodb').description('Database typeorm type'),
    DATABASE_URL: Joi.string().uri().required().example('mongodb://root:1111@mongo:27017/test?authSource=admin').description('Database connection url'),
  })
  .unknown()

const { value: env, error } = schema.prefs({ errors: { label: 'key' } }).validate(process.env)

if (error) {
  throw new Error(`Config validation error: ${ error.message }`)
}

const environment: string = env.NODE_ENV

export default {
  env: environment,
  projectDir: path.resolve(__dirname, '..'),
  app: {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    port: env.PORT,
    cors: true,
    validator: false,
  },
  auth: {
    permissions: {
      [Permission.REGULAR]: [],
      [Permission.ROOT]: [
        Permission.ALL,
      ],
    },
  },
  validator: {
    validationError: {
      target: false,
      value: true,
    },
  },
  logger: {
    enabled: environment !== 'test',
    level: environment === 'development' ? 'debug' : 'info',
    format: environment === 'development' ? 'dev' : 'tiny',
  },
  db: {
    type: env.DATABASE_TYPE as 'mongodb',
    url: env.DATABASE_URL as string,
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
  graphql: {
    enabled: true,
    route: '/graphql',
    username: 'any',
    password: 'any',
  },
}
