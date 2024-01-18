import { MongoRepository } from "typeorm";
import Token, { TokenType } from "../entity/Token";
import Repository from "../decorator/Repository";

@Repository(Token)
export default class TokenRepository extends MongoRepository<Token> {

    public async findOneByAttrs(token: string, type: TokenType, userId: string): Promise<Token | null> {
        return await this.findOneBy({ token, type, userId });
    }
}