import application from './application'

application().api().up()
  .then(({ app, dataSource, port, logger }) => {
    const server = app.listen(port, () => logger.info(`Server is running on port ${ port }`))

    const closeProcesses = (code: number = 1) => {
      server.close(() => {
        logger.info('Server closed')
        dataSource.destroy().then(() => {
          logger.info('Database connection closed')
          process.exit(code)
        })
      })
    }
    const failureHandler = (error: string) => {
      logger.error(error)
      closeProcesses(1)
    }

    process.on('uncaughtException', failureHandler)
    process.on('unhandledRejection', failureHandler)

    const successHandler = () => {
      logger.info('SIGTERM received')
      closeProcesses(0)
    }

    process.on('SIGTERM', successHandler)
  })
  .catch(error => console.log(error))
