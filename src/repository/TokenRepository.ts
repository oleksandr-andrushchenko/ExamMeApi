import { MongoRepository } from "typeorm";
import { Service } from "typedi";
import Token from "../entity/Token";
import Category from "../entity/Category";
import createRepository from "../util/createRepository";

// @ts-ignore
const create = () => createRepository(Category, (...args) => new TokenRepository(...args));

@Service({ factory: create })
export default class TokenRepository extends MongoRepository<Token> {

    public async findAll(): Promise<Token[]> {
        return await this.find();
    }
}