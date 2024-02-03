import { Inject, Service } from "typedi";
import { validateOrReject, ValidatorOptions } from "class-validator";
import ValidatorInterface from "./ValidatorInterface";
import ValidatorError from "../../error/validator/ValidatorError";
import { ValidationError } from "class-validator";

@Service()
export default class ClassValidatorValidator implements ValidatorInterface {

    constructor(
        @Inject('validatorOptions') private readonly options: ValidatorOptions,
    ) {
    }

    public async validate(object: object): Promise<void> {
        try {
            await validateOrReject(object, this.options);
        } catch (errors) {
            throw new ValidatorError((errors as ValidationError[]));
        }
    }
}