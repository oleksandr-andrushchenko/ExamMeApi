export default interface TokenStrategyInterface {

    encodeToken<Payload>(payload: Payload, expires: number): Promise<string>;

    decodeToken<Payload>(token: string): Promise<Payload>;
}
