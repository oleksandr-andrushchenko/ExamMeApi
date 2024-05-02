import 'reflect-metadata'
import { ConnectionManager, useContainer as typeormUseContainer } from 'typeorm'
import { Container } from 'typedi'
import config from './config'
import {
  getMetadataArgsStorage,
  useContainer as routingControllerUseContainer,
  useExpressServer,
} from 'routing-controllers'
import express, { Application } from 'express'
import LoggerInterface from './services/logger/LoggerInterface'
import JwtTokenStrategyFactory from './services/token/strategy/JwtTokenStrategyFactory'
import TokenStrategyInterface from './services/token/strategy/TokenStrategyInterface'
import { MongoConnectionOptions } from 'typeorm/driver/mongodb/MongoConnectionOptions'
import { MongoDriver } from 'typeorm/driver/mongodb/MongoDriver'
import { validationMetadatasToSchemas } from 'class-validator-jsonschema'
import * as swaggerUiExpress from 'swagger-ui-express'
import { routingControllersToSpec } from 'routing-controllers-openapi'
import { RoutingControllersOptions } from 'routing-controllers/types/RoutingControllersOptions'
import basicAuth from 'express-basic-auth'
import { MetadataStorage } from 'class-transformer/types/MetadataStorage'
import NullLogger from './services/logger/NullLogger'
import ClassValidatorValidator from './services/validator/ClassValidatorValidator'
import WinstonLogger from './services/logger/WinstonLogger'
import { createServer } from 'http'
import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { expressMiddleware } from '@apollo/server/express4'
import { buildSchema } from 'type-graphql'
import { resolvers } from './resolvers/resolvers'
import { scalars } from './scalars/scalars'
import { errors } from './errors/errors'
import Context from './context/Context'
import { AuthCheckerService } from './services/auth/AuthCheckerService'
import { GraphQLError } from 'graphql/error'
import type { GraphQLFormattedError } from 'graphql/index'

type Api = {
  app: Application,
  up: (listen?: boolean) => Promise<void>,
  down: (callback?: () => {}) => Promise<void>,
}

export default (): { api: () => Api } => {
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
    entities: [ `${ projectDir }/src/entities/*.ts` ],
    subscribers: [ `${ projectDir }/src/subscribers/*.ts` ],
    migrations: [ `${ projectDir }/src/migrations/*.ts` ],
    monitorCommands: mongoLogging,
  }

  const db = connectionManager.create(dataSourceOptions)

  const api = (): Api => {
    const app = express()
    const server = createServer(app)

    const up = async (listen?: boolean): Promise<void> => {
      routingControllerUseContainer(Container)

      const authChecker = Container.get<AuthCheckerService>(AuthCheckerService)

      const routingControllersOptions: RoutingControllersOptions = {
        authorizationChecker: authChecker.getRoutingControllersAuthorizationChecker(),
        currentUserChecker: authChecker.getRoutingControllersCurrentUserChecker(),
        controllers: [ `${ projectDir }/src/controllers/*.ts` ],
        middlewares: [ `${ projectDir }/src/middlewares/*.ts` ],
        cors: config.app.cors,
        validation: config.app.validator,
        classTransformer: true,
        defaultErrorHandler: false,
      }

      useExpressServer(app, routingControllersOptions)

      await db.initialize()

      if (mongoLogging) {
        const conn = (db.driver as MongoDriver).queryRunner.databaseConnection
        conn.on('commandStarted', (event) => logger.debug('commandStarted', event))
        conn.on('commandSucceeded', (event) => logger.debug('commandSucceeded', event))
        conn.on('commandFailed', (event) => logger.error('commandFailed', event))
      }

      if (config.swagger.enabled) {
        const { defaultMetadataStorage } = require('class-transformer/cjs/storage')
        const spec = routingControllersToSpec(getMetadataArgsStorage(), routingControllersOptions, {
          components: {
            // @ts-expect-error non-documented property
            schemas: validationMetadatasToSchemas({
              classTransformerMetadataStorage: defaultMetadataStorage as MetadataStorage,
              refPointerPrefix: '#/components/schemas/',
            }),
            securitySchemes: {
              // todo: move this part to authService
              bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
              },
            },
          },
          info: {
            description: config.app.description,
            title: config.app.name,
            version: config.app.version,
          },
        })
        app.use(
          config.swagger.route,
          basicAuth({
            users: { [config.swagger.username]: config.swagger.password },
            challenge: true,
          }),
          swaggerUiExpress.serve,
          swaggerUiExpress.setup(spec),
        )
      }

      if (config.graphql.enabled) {
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

        app.use(
          config.graphql.route,
          express.json(),
          expressMiddleware(apolloServer, {
            context: async ({ req }) => {
              return {
                user: await authChecker.getApolloContextUser(req),
              }
            },
          }),
        )
      }

      if (listen) {
        const port = config.app.port
        server.listen({ port }, () => logger.info(`Server is running on port ${ port }`))

        const failureHandler = (error: string) => {
          logger.error(error)
          down(() => process.exit(1))
        }

        process.on('uncaughtException', failureHandler)
        process.on('unhandledRejection', failureHandler)

        const successHandler = () => {
          logger.info('SIGTERM received')
          down(() => process.exit(0))
        }

        process.on('SIGTERM', successHandler)
      }
    }

    const down = async (callback?: () => {}): Promise<void> => {
      server.close(() => {
        logger.info('Server closed')
        db.destroy().then(() => {
          logger.info('Database connection closed')
          callback && callback()
        })
      })
    }

    return { app, up, down }
  }

  return { api }
}