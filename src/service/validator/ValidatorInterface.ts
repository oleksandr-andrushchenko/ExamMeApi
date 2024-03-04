export default interface ValidatorInterface {

  validate(object: object): Promise<void>;
}