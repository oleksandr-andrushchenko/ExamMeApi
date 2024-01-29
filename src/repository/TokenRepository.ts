import { MongoRepository } from "typeorm";
import Token, { TokenType } from "../entity/Token";
import Repository from "../decorator/Repository";
import User from "../entity/User";

@Repository(Token)
export default class TokenRepository extends MongoRepository<Token> {

    public async findOneByTokenAndTypeAndUser(token: string, type: TokenType, user: User): Promise<Token | null> {
        return await this.findOneBy({ token, type, userId: user.getId() });
    }
}