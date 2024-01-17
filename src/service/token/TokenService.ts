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
    expires?: number,
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
        const payload = { userId: user._id.toString(), expires, type: TokenType.ACCESS };
        const token = await this.tokenStrategy.encodeToken<TokenPayload>(payload);

        return { token, expires };
    }

    public async verifyAccessToken(encoded: string): Promise<TokenPayload | null> {
        return await this.verifyToken(encoded, TokenType.ACCESS);
    }

    public async generateRefreshToken(user: User, expiresIn: number): Promise<GeneratedToken> {
        const expires = Date.now() + expiresIn;
        const payload = { userId: user._id.toString(), expires, type: TokenType.REFRESH };
        const token = await this.tokenStrategy.encodeToken<TokenPayload>(payload);
        await this.saveToken(token, user._id.toString(), expires, TokenType.REFRESH);

        return { token, expires };
    }

    public async saveToken(token: string, userId: string, expires: number, type: TokenType): Promise<Token> {
        const tokenRecord = new Token();
        tokenRecord.userId = userId;
        tokenRecord.value = token;
        tokenRecord.expires = expires;
        tokenRecord.type = type;

        return this.entityManager.save<Token>(tokenRecord);
    }

    public async verifyToken(encoded: string, type: TokenType): Promise<TokenPayload | null> {
        const payload: TokenPayload = await this.tokenStrategy.decodeToken<TokenPayload>(encoded);

        if (!payload?.userId || payload?.type !== type || (payload?.expires && payload.expires < Date.now())) {
            return null;
        }

        return payload;
    }

    public async getVerifiedToken(encoded: string, type: TokenType): Promise<Token | null> {
        const payload: TokenPayload = await this.verifyToken(encoded, type);

        if (!payload) {
            return null;
        }

        const token: Token = await this.tokenRepository.findOneByAttrs(encoded, type, payload.userId);

        if (!token || token?.expires < Date.now()) {
            return null;
        }

        return token;
    }
}
