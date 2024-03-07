import { Inject, Service } from 'typedi'
import User from '../../entity/User'
import TokenStrategyInterface from './strategy/TokenStrategyInterface'

export type GeneratedToken = {
  token: string;
  expires: number;
};

export enum TokenType {
  ACCESS = 'access',
}

export type TokenPayload = {
  userId: string;
  type: TokenType;
  expires?: number,
};

@Service()
export default class TokenService {

  constructor(
    @Inject('tokenStrategy') private readonly tokenStrategy: TokenStrategyInterface,
  ) {
  }

  public async generateAccessToken(user: User, expiresIn: number): Promise<GeneratedToken> {
    const expires = Date.now() + expiresIn
    const payload = { userId: user.getId().toString(), expires, type: TokenType.ACCESS }
    const token = await this.tokenStrategy.encodeToken<TokenPayload>(payload)

    return { token, expires }
  }

  public async verifyAccessToken(encoded: string): Promise<TokenPayload | null> {
    return await this.verifyToken(encoded, TokenType.ACCESS)
  }

  public async verifyToken(encoded: string, type: TokenType): Promise<TokenPayload | null> {
    const payload: TokenPayload = await this.tokenStrategy.decodeToken<TokenPayload>(encoded)

    if (!payload?.userId || payload?.type !== type || (payload?.expires && payload.expires < Date.now())) {
      return null
    }

    return payload
  }
}
