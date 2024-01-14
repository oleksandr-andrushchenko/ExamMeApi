import { Service, Inject } from "typedi";
import { DataSource, MongoRepository } from "typeorm";
import * as Repositories from "../repository";

@Service()
export class TypeormMongoRepositoryFactory {

    constructor(
        @Inject('data_source') private readonly dataSource: DataSource,
    ) {
    }

    public create<Entity>(entity: Entity & { [key: string]: any }): MongoRepository<Entity> {
        const repository: MongoRepository<Entity> = this.dataSource.manager.getMongoRepository(entity as any);

        return new Repositories[`${entity.name}Repository`](
            repository.target,
            repository.manager,
            repository.queryRunner,
        );
    }

}