import { MongoRepository } from "typeorm";
import { ObjectId as MongoObjectId } from "mongodb";
import { Service } from "typedi";
import User from "../entity/User";
import createRepository from "../util/createRepository";

// @ts-ignore
const create = () => createRepository(User, (...args) => new UserRepository(...args));

@Service({ factory: create })
export default class UserRepository extends MongoRepository<User> {

    public async findOneById(id: string): Promise<User | null> {
        return await this.findOneBy({ _id: new MongoObjectId(id) });
    }

    public async findOneByEmail(email: string): Promise<User | null> {
        return await this.findOneBy({ email });
    }
}