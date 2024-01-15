import { Service, Inject } from "typedi";
import { DataSource } from "typeorm";
import { Category } from "../entity/Category";
import { CategoryRepository } from "../repository/CategoryRepository";
import { UserRepository } from "../repository/UserRepository";
import { User } from "../entity/User";
import { TokenRepository } from "../repository/TokenRepository";
import { Token } from "../entity/Token";

@Service()
export class TypeormRepositoryFactory {

    constructor(
        @Inject('data_source') private readonly dataSource: DataSource,
    ) {
    }

    public createUser(): UserRepository {
        const { target, manager, queryRunner } = this.dataSource.manager.getMongoRepository(User);
        return new UserRepository(target, manager, queryRunner);
    }

    public createToken(): TokenRepository {
        const { target, manager, queryRunner } = this.dataSource.manager.getMongoRepository(Token);
        return new TokenRepository(target, manager, queryRunner);
    }

    public createCategory(): CategoryRepository {
        const { target, manager, queryRunner } = this.dataSource.manager.getMongoRepository(Category);
        return new CategoryRepository(target, manager, queryRunner);
    }
}