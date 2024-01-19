import { MongoRepository } from "typeorm";
import Category from "../entity/Category";
import Repository from "../decorator/Repository";
import { ObjectId } from "mongodb";

@Repository(Category)
export default class CategoryRepository extends MongoRepository<Category> {

    public async findOneById(id: string): Promise<Category | undefined> {
        return await this.findOneBy({ _id: new ObjectId(id) });
    }

    public async findOneByName(name: string): Promise<Category | undefined> {
        return await this.findOneBy({ name });
    }

    public async findAll(): Promise<Category[]> {
        return await this.find();
    }
}