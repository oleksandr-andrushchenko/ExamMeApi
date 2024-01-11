import { Inject, Service } from "typedi";
import { DataSource } from "typeorm";

@Service()
export class TypeormDefaultDataSourceFactory {
    constructor(
        @Inject('dbType') private readonly type: 'mongodb',
        @Inject('dbUrl') private readonly url: string,
        @Inject('dbSync') private readonly synchronize: boolean,
        @Inject('dbLogs') private readonly logging: boolean,
    ) {
    }

    public create(): DataSource {
        return new DataSource({
            type: this.type,
            url: this.url,
            synchronize: this.synchronize,
            logging: this.logging,
            entities: ['../../entities/*.ts'],
            migrations: ['../../migrations/*.ts'],
            subscribers: ['../../subscribers/*.ts'],
        });
    }
}