import { Service } from "typedi";
import { validate } from "class-validator";
import ValidatorInterface from "./ValidatorInterface";
import { ClassValidatorValidatorFactory } from "./ClassValidatorValidatorFactory";

@Service({ factory: [ClassValidatorValidatorFactory, 'create'] })
export default class ClassValidatorValidator implements ValidatorInterface {

    public async validate(object: object): Promise<void> {
        await validate(object);
    }
}