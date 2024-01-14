import { Category } from "../entity/Category";
import { MongoRepository } from "typeorm";

export class CategoryRepository extends MongoRepository<Category> {

    public async findAll(): Promise<Category[]> {
        return await this.find();
    }

}