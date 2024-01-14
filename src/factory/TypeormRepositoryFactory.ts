import { Service, Inject } from "typedi";
import { DataSource } from "typeorm";
import { Category } from "../entity/Category";
import { CategoryRepository } from "../repository/CategoryRepository";

@Service()
export class TypeormRepositoryFactory {

    constructor(
        @Inject('data_source') private readonly dataSource: DataSource,
    ) {
    }

    public createCategory(): CategoryRepository {
        const { target, manager, queryRunner } = this.dataSource.manager.getMongoRepository(Category);
        return new CategoryRepository(target, manager, queryRunner);
    }
}