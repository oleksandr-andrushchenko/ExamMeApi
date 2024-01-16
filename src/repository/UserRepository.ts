import { MongoRepository } from "typeorm";
import { Service } from "typedi";
import User from "../entity/User";
import Category from "../entity/Category";
import createRepository from "../util/createRepository";

// @ts-ignore
const create = () => createRepository(Category, (...args) => new UserRepository(...args));

@Service({ factory: create })
export default class UserRepository extends MongoRepository<User> {

    public async findOneByEmail(email: string): Promise<User | null> {
        return await this.findOneBy({ email });
    }
}