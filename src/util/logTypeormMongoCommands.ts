import { DataSource } from "typeorm";
import { MongoDriver } from "typeorm/driver/mongodb/MongoDriver";
import { MongoConnectionOptions } from "typeorm/driver/mongodb/MongoConnectionOptions";

export default (dataSource: DataSource): any => {
    const options: MongoConnectionOptions | any = dataSource.options;
    options.monitorCommands = true;
    const conn = (dataSource.driver as MongoDriver).queryRunner!.databaseConnection;
    conn.on("commandStarted", (evt) => {
        console.log(evt);
    });
    conn.on("commandSucceeded", (evt) => {
        console.log(evt);
    });
    conn.on("commandFailed", (evt) => {
        console.log(evt);
    });
}