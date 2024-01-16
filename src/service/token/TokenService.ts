import { Inject, Service } from "typedi";
import Token, { TokenType } from "../../entity/Token";
import User from "../../entity/User";
import TokenStrategyInterface from "./strategy/TokenStrategyInterface";
import { EntityManager } from "typeorm";
import TokenRepository from "../../repository/TokenRepository";

export type GeneratedToken = {
    token: string;
    expires: number;
};

export type TokenPayload = {
    userId: string;
    type: TokenType;
};

@Service()
export default class TokenService {

    constructor(
        @Inject('tokenStrategy') private readonly tokenStrategy: TokenStrategyInterface,
        @Inject('entityManager') private readonly entityManager: EntityManager,
        @Inject() private readonly tokenRepository: TokenRepository,
    ) {
    }

    public async generateAccessToken(user: User, expiresIn: number): Promise<GeneratedToken> {
        const expires = Date.now() + expiresIn;
        const payload = { userId: user._id.toString(), type: TokenType.ACCESS };
        const token = await this.tokenStrategy.encodeToken<TokenPayload>(payload, expires);

        return { token, expires };
    };

    public async generateRefreshToken(user: User, expiresIn: number): Promise<GeneratedToken> {
        const expires = Date.now() + expiresIn;
        const payload = { userId: user._id.toString(), type: TokenType.REFRESH };
        const token = await this.tokenStrategy.encodeToken<TokenPayload>(payload, expires);
        await this.saveToken(token, user._id.toString(), expires, TokenType.REFRESH);

        return { token, expires };
    };

    public async saveToken(token: string, userId: string, expires: number, type: TokenType): Promise<Token> {
        const tokenRecord = new Token();
        tokenRecord.userId = userId;
        tokenRecord.value = token;
        tokenRecord.expires = expires;
        tokenRecord.type = type;

        return this.entityManager.save<Token>(tokenRecord);
    };

    public async verifyToken(token: string, type: string): Promise<Token | null> {
        const payload: TokenPayload = await this.tokenStrategy.decodeToken<TokenPayload>(token);

        const tokenUserId: string = payload.userId;
        const tokenType: TokenType = payload.type;

        if (!tokenUserId || !tokenType || tokenType !== type) {
            return null;
        }

        const tokenRecord: Token = await this.tokenRepository.findOneBy({ token, type, userId: tokenUserId });

        if (!tokenRecord.expires) {
            return tokenRecord;
        }

        if (tokenRecord.expires < Date.now()) {
            return null;
        }

        return tokenRecord;
    }
}
