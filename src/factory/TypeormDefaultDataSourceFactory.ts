import { Inject, Service } from "typedi";
import { DataSource } from "typeorm";
import { MongoConnectionOptions } from "typeorm/driver/mongodb/MongoConnectionOptions";

@Service()
export class TypeormDefaultDataSourceFactory {

    constructor(
        @Inject('db_type') private readonly type: string,
        @Inject('db_url') private readonly url: string,
        @Inject('db_synchronize') private readonly synchronize: boolean,
        @Inject('db_logging') private readonly logging: boolean,
        @Inject('project_dir') private readonly projectDir: string,
    ) {
    }

    public create(): DataSource {
        const dataSourceOptions: MongoConnectionOptions = {
            type: this.type as 'mongodb',
            url: this.url,
            synchronize: this.synchronize,
            logging: this.logging,
            entities: [`${this.projectDir}/src/entity/*.ts`],
        }

        return new DataSource(dataSourceOptions);
    }

}