import { MongoRepository } from "typeorm";
import Category from "../entity/Category";
import Repository from "../decorator/Repository";

@Repository(Category)
export default class CategoryRepository extends MongoRepository<Category> {

    public async findAll(): Promise<Category[]> {
        return await this.find();
    }
}