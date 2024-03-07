export default interface TokenStrategyInterface {

  encodeToken<Payload>(payload: Payload): Promise<string>;

  decodeToken<Payload>(token: string): Promise<Payload>;
}
