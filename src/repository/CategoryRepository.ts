import { Category } from "../entity/Category";
import { MongoRepository } from "typeorm";
import { Service } from "typedi";
import { TypeormRepositoryFactory } from "../factory/TypeormRepositoryFactory";

@Service({ factory: [TypeormRepositoryFactory, 'createCategory'] })
export class CategoryRepository extends MongoRepository<Category> {

    public async findAll(): Promise<Category[]> {
        return await this.find();
    }
}