import { MongoRepository } from "typeorm";
import { Service } from "typedi";
import { TypeormRepositoryFactory } from "../factory/TypeormRepositoryFactory";
import { User } from "../entity/User";

@Service({ factory: [TypeormRepositoryFactory, 'createUser'] })
export class UserRepository extends MongoRepository<User> {

    public async findAll(): Promise<User[]> {
        return await this.find();
    }
}