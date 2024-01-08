import app from './app';
import config from "./config";

app.listen(config.port, (): void => console.log(`Server is running on port ${config.port}`));
