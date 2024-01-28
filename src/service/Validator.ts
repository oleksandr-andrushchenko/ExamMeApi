import { Service } from "typedi";
import { validate } from "class-validator";

@Service()
export default class Validator {

    public async validate(object: object): Promise<void> {
        await validate(object);
    }
}