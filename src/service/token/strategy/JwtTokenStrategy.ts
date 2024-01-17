import TokenStrategyInterface from "./TokenStrategyInterface";
import * as jwt from 'jsonwebtoken';

export default class JwtTokenStrategy implements TokenStrategyInterface {

    constructor(
        private readonly secret: string,
    ) {
    }

    public async encodeToken<Payload>(token: Payload): Promise<string> {
        return jwt.sign(token as unknown as object, this.secret, { expiresIn: '100d' });
    }

    public async decodeToken<Payload>(token: string): Promise<Payload> {
        return jwt.verify(token, this.secret) as Payload;
    }
}