import { ValidationError } from "class-validator";

export default class ValidatorError extends Error {

    constructor(
        private readonly errors: ValidationError[],
    ) {
        super(`Validation error${errors.length === 1 ? '' : 's'} ${JSON.stringify(errors)}`);
    }

    public getErrors(): ValidationError[] {
        return this.errors;
    }
}