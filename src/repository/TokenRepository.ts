import { MongoRepository } from "typeorm";
import { Service } from "typedi";
import { TypeormRepositoryFactory } from "../factory/TypeormRepositoryFactory";
import { Token } from "../entity/Token";

@Service({ factory: [TypeormRepositoryFactory, 'createToken'] })
export class TokenRepository extends MongoRepository<Token> {

    public async findAll(): Promise<Token[]> {
        return await this.find();
    }
}