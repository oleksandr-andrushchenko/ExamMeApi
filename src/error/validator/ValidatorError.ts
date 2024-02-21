import { ValidationError } from "class-validator";

export default class ValidatorError extends Error {

    constructor(
        private readonly errors: ValidationError[],
    ) {
        super(`Validation errors ${JSON.stringify(errors)}`);
    }

    public getErrors(): ValidationError[] {
        return this.errors;
    }
}