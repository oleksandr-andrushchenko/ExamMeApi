import 'reflect-metadata'
import { ConnectionManager, useContainer as typeormUseContainer } from 'typeorm'
import { Container } from 'typedi'
import config from './config'
import express from 'express'
import LoggerInterface from './services/logger/LoggerInterface'
import JwtTokenStrategyFactory from './services/token/strategy/JwtTokenStrategyFactory'
import TokenStrategyInterface from './services/token/strategy/TokenStrategyInterface'
import { MongoConnectionOptions } from 'typeorm/driver/mongodb/MongoConnectionOptions'
import { MongoDriver } from 'typeorm/driver/mongodb/MongoDriver'
import NullLogger from './services/logger/NullLogger'
import ClassValidatorValidator from './services/validator/ClassValidatorValidator'
import WinstonLogger from './services/logger/WinstonLogger'
import { createServer } from 'http'
import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { expressMiddleware } from '@apollo/server/express4'
import { buildSchema } from 'type-graphql'
import { resolvers } from './resolvers'
import { scalars } from './scalars'
import { errors } from './errors'
import { subscribers } from './subscribers'
import Context from './context/Context'
import { entities } from './entities'
import { AuthCheckerService } from './services/auth/AuthCheckerService'
import { GraphQLError } from 'graphql/error'
import type { GraphQLFormattedError } from 'graphql/index'
import cors from 'cors'
import compression from 'compression'

typeormUseContainer(Container)

Container.set('env', config.env)
Container.set('loggerFormat', config.logger.format)
Container.set('loggerLevel', config.logger.level)
Container.set('authPermissions', config.auth.permissions)
Container.set('validatorOptions', config.validator)

const logger: LoggerInterface = config.logger.enabled ? Container.get<WinstonLogger>(WinstonLogger) : new NullLogger()
Container.set('logger', logger)

Container.set('validator', Container.get<ClassValidatorValidator>(ClassValidatorValidator))

const projectDir = config.projectDir
const mongoLogging = config.db.type === 'mongodb' && config.db.logging

const connectionManager = new ConnectionManager()
Container.set(ConnectionManager, connectionManager)

const tokenStrategy: TokenStrategyInterface = Container.get<JwtTokenStrategyFactory>(JwtTokenStrategyFactory).create(config.jwt)
Container.set('tokenStrategy', tokenStrategy)

const dataSourceOptions: MongoConnectionOptions = {
  type: config.db.type,
  url: config.db.url,
  synchronize: config.db.synchronize,
  logging: config.db.logging,
  entities,
  subscribers,
  monitorCommands: mongoLogging,
}

const db = connectionManager.create(dataSourceOptions)

export const app = express()
const server = createServer(app)

export const appUp = async (listen?: boolean): Promise<void> => {
  const authChecker = Container.get<AuthCheckerService>(AuthCheckerService)

  await db.initialize()

  if (mongoLogging) {
    const conn = (db.driver as MongoDriver).queryRunner.databaseConnection
    conn.on('commandStarted', (event) => logger.debug('commandStarted', event))
    conn.on('commandSucceeded', (event) => logger.debug('commandSucceeded', event))
    conn.on('commandFailed', (event) => logger.error('commandFailed', event))
  }

  const schema = await buildSchema({
    // @ts-ignore
    resolvers,
    scalarsMap: scalars,
    container: Container,
    authChecker: authChecker.getTypeGraphqlAuthChecker(),
    emitSchemaFile: `${ projectDir }/schema.graphql`,
  })
  const apolloServer = new ApolloServer<Context>({
    schema,
    plugins: [ ApolloServerPluginDrainHttpServer({ httpServer: server }) ],
    formatError: (formattedError: GraphQLFormattedError, error: GraphQLError) => {
      for (const name in errors) {
        for (const key of [ error.originalError.constructor.name, formattedError.extensions.code as string ]) {
          if (key && errors[name].types.includes(key)) {
            return { ...formattedError, extensions: { name, code: errors[name].code } }
          }
        }
      }

      return formattedError
    },
  })

  await apolloServer.start()

  app.use(cors())
  app.use(express.json())
  app.use(compression())
  app.use(expressMiddleware(apolloServer, {
    context: async ({ req }) => {
      return {
        user: await authChecker.getApolloContextUser(req),
      }
    },
  }))

  if (listen) {
    const port = config.app.port
    server.listen({ port }, () => logger.info(`Server is running on port ${ port }`))

    const failureHandler = (error: string) => {
      logger.error(error)
      appDown(() => process.exit(1))
    }

    process.on('uncaughtException', failureHandler)
    process.on('unhandledRejection', failureHandler)

    const successHandler = () => {
      logger.info('SIGTERM received')
      appDown(() => process.exit(0))
    }

    process.on('SIGTERM', successHandler)
  }
}
export const appDown = async (callback?: () => {}): Promise<void> => {
  server.close(() => {
    logger.info('Server closed')
    db.destroy().then(() => {
      logger.info('Database connection closed')
      callback && callback()
    })
  })
}