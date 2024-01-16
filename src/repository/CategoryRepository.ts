import { MongoRepository } from "typeorm";
import { Service } from "typedi";
import Category from "../entity/Category";
import createRepository from "../util/createRepository";

// @ts-ignore
const create = () => createRepository(Category, (...args) => new CategoryRepository(...args));

@Service({ factory: create })
export default class CategoryRepository extends MongoRepository<Category> {

    public async findAll(): Promise<Category[]> {
        return await this.find();
    }
}