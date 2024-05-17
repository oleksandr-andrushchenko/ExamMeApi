import path from 'path'
// @ts-ignore
import pkg from '../package.json'
import Permission from './enums/Permission'
import Env from './schema/config/Env'
import EnvValidator from './services/config/EnvValidator'

const env = new Env(process.env)
EnvValidator.validateEnv(env)

const environment: string = env.NODE_ENV
console.log('config')
export default {
  env: environment,
  projectDir: path.resolve(__dirname, '..'),
  client_url: env.CLIENT_URL,
  app: {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    port: env.PORT,
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
}
