import { MongoRepository } from "typeorm";
import { Service } from "typedi";
import Token, { TokenType } from "../entity/Token";
import Category from "../entity/Category";
import createRepository from "../util/createRepository";

// @ts-ignore
const create = () => createRepository(Category, (...args) => new TokenRepository(...args));

@Service({ factory: create })
export default class TokenRepository extends MongoRepository<Token> {

    public async findOneByAttrs(token: string, type: TokenType, userId: string): Promise<Token | null> {
        return await this.findOneBy({ token, type, userId });
    }
}