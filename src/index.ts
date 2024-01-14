import 'reflect-metadata';
import application from "./application";

const app = application()
    .then(({ server, port, logger }) => server.listen(port, () => logger.info(`Server is running on port ${port}`)))
    .catch(error => console.log(error))
;